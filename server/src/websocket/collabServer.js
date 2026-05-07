import { WebSocketServer } from 'ws'
import { verifyToken } from '../services/authService.js'
import { getMemberRole, getProject, updateProjectState } from '../services/projectsService.js'

// rooms: Map<projectId, Map<userId, { ws, email, userId, role, cursor }>>
const rooms = new Map()

// roomStates: Map<projectId, fullProjectState> — latest multi-map state, avoids DB reads per action
const roomStates = new Map()

// userSockets: Map<userId, Set<ws>>  — for user-level notifications (invites, etc.)
const userSockets = new Map()

function registerUserSocket(userId, ws) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set())
  userSockets.get(userId).add(ws)
}

function unregisterUserSocket(userId, ws) {
  const sockets = userSockets.get(userId)
  if (!sockets) return
  sockets.delete(ws)
  if (sockets.size === 0) userSockets.delete(userId)
}

export function notifyUser(userId, message) {
  const sockets = userSockets.get(userId)
  if (!sockets) return
  const data = JSON.stringify(message)
  for (const ws of sockets) {
    if (ws.readyState === 1) ws.send(data)
  }
}

export function updateRoomState(projectId, state) {
  roomStates.set(projectId, state)
}

function getRoomUsers(projectId) {
  const room = rooms.get(projectId)
  if (!room) return []
  return Array.from(room.values()).map(u => ({
    userId: u.userId, email: u.email, role: u.role,
    cursor: u.cursor || null,
    color: u.color,
  }))
}

function broadcast(projectId, message, excludeUserId = null) {
  const room = rooms.get(projectId)
  if (!room) return
  const data = JSON.stringify(message)
  for (const [uid, client] of room.entries()) {
    if (uid === excludeUserId) continue
    if (client.ws.readyState === 1) { // OPEN
      client.ws.send(data)
    }
  }
}

function userColor(userId) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
  return colors[userId % colors.length]
}

export function attachCollabServer(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws) => {
    let currentUser = null    // { id, email }
    let currentProjectId = null

    ws.on('message', async (raw) => {
      let msg
      try { msg = JSON.parse(raw) } catch { return }

      try {
        switch (msg.type) {
          // ── Notification auth: register for user-level push events ──────
          case 'auth': {
            let payload
            try { payload = verifyToken(msg.token) } catch {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }))
              return
            }
            const userId = payload.userId
            const email = payload.email || ''
            currentUser = { id: userId, email }
            registerUserSocket(userId, ws)
            ws.send(JSON.stringify({ type: 'authenticated', userId }))
            break
          }

          // ── Project room join ────────────────────────────────────────────
          case 'join': {
            let payload
            try { payload = verifyToken(msg.token) } catch {
              ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }))
              return
            }
            const userId = payload.userId
            const email = payload.email || ''

            // Check membership
            let member
            try {
              member = await getMemberRole(msg.projectId, userId)
            } catch {
              member = null
            }
            if (!member) {
              ws.send(JSON.stringify({ type: 'error', message: 'Access denied to this project' }))
              return
            }

            // Leave previous room if switching
            if (currentProjectId && currentUser) {
              leaveRoom(currentProjectId, currentUser.id, ws)
            }

            currentUser = { id: userId, email }
            currentProjectId = msg.projectId

            // Register for user-level notifications too
            registerUserSocket(userId, ws)

            // Join project room
            if (!rooms.has(msg.projectId)) rooms.set(msg.projectId, new Map())
            const room = rooms.get(msg.projectId)
            room.set(userId, {
              ws, userId, email,
              role: member.role, cursor: null,
              color: userColor(userId),
            })

            // Load current project state — use in-memory cache if room already active
            let projectState = roomStates.get(msg.projectId) || null
            if (!projectState) {
              try {
                const project = await getProject(msg.projectId, userId)
                if (project) {
                  projectState = project.state
                  roomStates.set(msg.projectId, projectState)
                }
              } catch { /* DB unavailable */ }
            }

            ws.send(JSON.stringify({
              type: 'joined',
              projectId: msg.projectId,
              state: projectState,
              myRole: member.role,
              myUserId: userId,
              myColor: userColor(userId),
              presence: getRoomUsers(msg.projectId),
            }))

            broadcast(msg.projectId, {
              type: 'presence',
              projectId: msg.projectId,
              users: getRoomUsers(msg.projectId),
            }, userId)
            break
          }

          case 'action': {
            if (!currentUser || !currentProjectId) return
            const room = rooms.get(currentProjectId)
            if (!room) return
            const client = room.get(currentUser.id)
            if (!client || client.role === 'view') {
              ws.send(JSON.stringify({ type: 'error', message: 'View-only access — cannot make edits' }))
              return
            }

            broadcast(currentProjectId, {
              type: 'action',
              projectId: currentProjectId,
              action: msg.action,
              userId: currentUser.id,
              email: currentUser.email,
            }, currentUser.id)

            if (msg.state) {
              try {
                if (msg.state._mapId) {
                  // Per-map update: merge into cached project state
                  const { _mapId, ...mapState } = msg.state
                  const currentState = roomStates.get(currentProjectId) || { maps: {}, mapOrder: [], activeMapId: null }
                  const newState = {
                    ...currentState,
                    maps: { ...(currentState.maps || {}), [_mapId]: mapState },
                  }
                  roomStates.set(currentProjectId, newState)
                  await updateProjectState(currentProjectId, newState)
                } else {
                  // Full project state update (map CRUD or legacy)
                  roomStates.set(currentProjectId, msg.state)
                  await updateProjectState(currentProjectId, msg.state)
                }
              } catch { /* DB unavailable */ }
            }
            break
          }

          case 'state_sync': {
            if (!currentUser || !currentProjectId) return
            const room = rooms.get(currentProjectId)
            const client = room?.get(currentUser.id)
            if (!client || client.role === 'view') return
            try {
              await updateProjectState(currentProjectId, msg.state)
            } catch { /* DB unavailable */ }
            break
          }

          case 'cursor': {
            if (!currentUser || !currentProjectId) return
            const room = rooms.get(currentProjectId)
            if (!room) return
            const client = room.get(currentUser.id)
            if (client) client.cursor = { x: msg.x, y: msg.y }

            broadcast(currentProjectId, {
              type: 'cursor',
              userId: currentUser.id,
              email: currentUser.email,
              color: client?.color || '#3B82F6',
              x: msg.x, y: msg.y,
            }, currentUser.id)
            break
          }

          case 'leave': {
            if (currentUser && currentProjectId) {
              leaveRoom(currentProjectId, currentUser.id, ws)
              currentProjectId = null
            }
            break
          }
        }
      } catch (err) {
        console.error('WS handler error:', err.message)
      }
    })

    ws.on('close', () => {
      if (currentUser) {
        if (currentProjectId) leaveRoom(currentProjectId, currentUser.id, ws)
        unregisterUserSocket(currentUser.id, ws)
      }
    })

    ws.on('error', (err) => {
      console.error('WS error:', err.message)
    })
  })

  function leaveRoom(projectId, userId, ws) {
    const room = rooms.get(projectId)
    if (!room) return
    room.delete(userId)
    if (room.size === 0) {
      rooms.delete(projectId)
      roomStates.delete(projectId)
    } else {
      broadcast(projectId, {
        type: 'presence',
        projectId,
        users: getRoomUsers(projectId),
      })
    }
  }

  return wss
}

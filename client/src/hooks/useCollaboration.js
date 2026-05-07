import { useState, useEffect, useRef, useCallback } from 'react'
import { WS_URL } from '../lib/projectsApi.js'

/**
 * Manages WebSocket connection for real-time project collaboration.
 *
 * Returns:
 *  - myRole: 'admin' | 'edit' | 'view' | null
 *  - myUserId: number | null
 *  - myColor: string
 *  - presence: [{ userId, email, role, cursor, color }]
 *  - connected: bool
 *  - joinProject(projectId, token) — join a collab room
 *  - leaveProject() — leave current room
 *  - sendAction(action, state) — broadcast an action + optional state snapshot
 *  - sendCursor(x, y) — broadcast cursor position
 *  - onRemoteAction: set this callback to receive remote actions
 */
export function useCollaboration() {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [myRole, setMyRole] = useState(null)
  const [myUserId, setMyUserId] = useState(null)
  const [myColor, setMyColor] = useState('#3B82F6')
  const [presence, setPresence] = useState([])
  const remoteActionCbRef = useRef(null)
  const currentProjectRef = useRef(null)
  const tokenRef = useRef(null)
  const reconnectTimer = useRef(null)

  function connect(projectId, token) {
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
    }

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws
    tokenRef.current = token
    currentProjectRef.current = projectId

    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'join', projectId, token }))
    }

    ws.onmessage = (event) => {
      let msg
      try { msg = JSON.parse(event.data) } catch { return }

      switch (msg.type) {
        case 'joined':
          setMyRole(msg.myRole)
          setMyUserId(msg.myUserId)
          setMyColor(msg.myColor)
          setPresence(msg.presence || [])
          if (remoteActionCbRef.current && msg.state) {
            remoteActionCbRef.current({ type: '__SYNC__', state: msg.state })
          }
          break
        case 'action':
          if (remoteActionCbRef.current) {
            remoteActionCbRef.current(msg.action, msg.userId, msg.email)
          }
          break
        case 'presence':
          setPresence(msg.users || [])
          break
        case 'cursor':
          setPresence(prev => prev.map(u =>
            u.userId === msg.userId
              ? { ...u, cursor: { x: msg.x, y: msg.y }, color: msg.color }
              : u
          ))
          break
        case 'error':
          console.warn('Collab WS error:', msg.message)
          break
      }
    }

    ws.onerror = () => {
      setConnected(false)
    }

    ws.onclose = () => {
      setConnected(false)
      setMyRole(null)
      setPresence([])
      // Auto-reconnect after 3s if still same project
      if (currentProjectRef.current === projectId) {
        reconnectTimer.current = setTimeout(() => {
          if (currentProjectRef.current === projectId && tokenRef.current) {
            connect(projectId, tokenRef.current)
          }
        }, 3000)
      }
    }
  }

  function joinProject(projectId, token) {
    clearTimeout(reconnectTimer.current)
    connect(projectId, token)
  }

  function leaveProject() {
    clearTimeout(reconnectTimer.current)
    currentProjectRef.current = null
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave' }))
      wsRef.current.onclose = null
      wsRef.current.close()
    }
    wsRef.current = null
    setConnected(false)
    setMyRole(null)
    setPresence([])
  }

  const sendAction = useCallback((action, state) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'action', action, state: state || null }))
    }
  }, [])

  const sendCursor = useCallback((x, y) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cursor', x, y }))
    }
  }, [])

  function setRemoteActionCallback(cb) {
    remoteActionCbRef.current = cb
  }

  useEffect(() => {
    return () => {
      clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [])

  return {
    connected, myRole, myUserId, myColor, presence,
    joinProject, leaveProject, sendAction, sendCursor, setRemoteActionCallback,
  }
}

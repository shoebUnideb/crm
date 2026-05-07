import { useState, useEffect, useRef, useCallback } from 'react'
import { WS_URL, projectsApi } from '../lib/projectsApi.js'

export function useNotifications(token) {
  const [invites, setInvites] = useState([])
  const wsRef = useRef(null)

  // Fetch pending invites from DB on login / token change
  useEffect(() => {
    if (!token) { setInvites([]); return }
    projectsApi.getMyInvites(token).then(setInvites).catch(() => {})
  }, [token])

  // Persistent WS connection for real-time invite push
  useEffect(() => {
    if (!token) return

    function connect() {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'auth', token }))
      }

      ws.onmessage = (event) => {
        let msg
        try { msg = JSON.parse(event.data) } catch { return }
        if (msg.type === 'invite_received') {
          setInvites(prev => {
            if (prev.some(i => i.token === msg.token)) return prev
            return [msg, ...prev]
          })
        }
      }

      ws.onclose = () => {
        // Reconnect after 4s if token is still valid
        setTimeout(() => {
          if (wsRef.current === ws && token) connect()
        }, 4000)
      }

      ws.onerror = () => { ws.close() }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [token])

  const acceptInvite = useCallback(async (inviteToken) => {
    const result = await projectsApi.acceptInvite(token, inviteToken)
    // result = { projectId, role }
    setInvites(prev => prev.filter(i => i.token !== inviteToken))
    // Fetch the full project so the caller can inject it into local state
    try {
      const projectData = await projectsApi.get(token, result.projectId)
      return { ...projectData, role: result.role }
    } catch {
      return null
    }
  }, [token])

  const declineInvite = useCallback(async (inviteToken) => {
    await projectsApi.declineInvite(token, inviteToken)
    setInvites(prev => prev.filter(i => i.token !== inviteToken))
  }, [token])

  return { invites, acceptInvite, declineInvite }
}

import React, { useEffect, useState } from 'react'

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  function showToast(message, duration = 2500) {
    const id = ++toastId
    setToasts(t => [...t, { id, message }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }

  return { toasts, showToast }
}

export function ToastContainer({ toasts }) {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="px-4 py-2 bg-gray-800 text-white text-xs rounded-full shadow-lg opacity-90 animate-fade-in"
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

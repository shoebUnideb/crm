import React from 'react'

export default function SuccessOverlay({ tickets, baseUrl, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-green-500 text-xl">✓</span>
            <h3 className="font-semibold text-gray-800">
              {tickets.length} Ticket{tickets.length !== 1 ? 's' : ''} Created
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {tickets.map(ticket => (
            <a
              key={ticket.key}
              href={`${baseUrl}/browse/${ticket.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="font-mono text-sm font-medium text-blue-600 shrink-0">{ticket.key}</span>
              <span className="text-sm text-gray-600 truncate">{ticket.title}</span>
              <span className="text-gray-300 text-xs ml-auto shrink-0">↗</span>
            </a>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}

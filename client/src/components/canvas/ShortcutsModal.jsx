import React, { useEffect } from 'react'

const SHORTCUTS = [
  { category: 'Navigation', items: [
    { keys: ['↑ ↓ ← →'], desc: 'Navigate between nodes' },
    { keys: ['F'], desc: 'Focus selected / fit all' },
    { keys: ['Ctrl+F'], desc: 'Search nodes' },
  ]},
  { category: 'Editing', items: [
    { keys: ['Double-click'], desc: 'Edit node title' },
    { keys: ['Tab'], desc: 'Add child node' },
    { keys: ['Delete'], desc: 'Delete node or edge' },
    { keys: ['Ctrl+D'], desc: 'Duplicate node' },
    { keys: ['Ctrl+C'], desc: 'Copy node subtree' },
    { keys: ['Ctrl+V'], desc: 'Paste subtree' },
    { keys: ['Ctrl+Z'], desc: 'Undo' },
    { keys: ['Ctrl+⇧Z'], desc: 'Redo' },
  ]},
  { category: 'Selection', items: [
    { keys: ['Click'], desc: 'Select node' },
    { keys: ['Shift+Click'], desc: 'Multi-select node' },
    { keys: ['Escape'], desc: 'Deselect / close' },
  ]},
  { category: 'View', items: [
    { keys: ['Scroll'], desc: 'Zoom in / out' },
    { keys: ['Drag canvas'], desc: 'Pan' },
    { keys: ['P'], desc: 'Presentation mode' },
    { keys: ['N'], desc: 'Toggle notes panel' },
    { keys: ['?'], desc: 'Show this help' },
  ]},
]

export default function ShortcutsModal({ onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' || e.key === '?') onClose() }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-[560px] max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-semibold text-gray-800">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        {/* Shortcut grid */}
        <div className="grid grid-cols-2 gap-6 p-6">
          {SHORTCUTS.map(section => (
            <div key={section.category}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{section.category}</h3>
              <div className="space-y-1.5">
                {section.items.map(({ keys, desc }) => (
                  <div key={desc} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">{desc}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {keys.map(k => (
                        <kbd key={k} className="text-xs bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-600 whitespace-nowrap">{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400 text-center">
          Press <kbd className="bg-gray-100 border border-gray-200 rounded px-1 font-mono">?</kbd> or <kbd className="bg-gray-100 border border-gray-200 rounded px-1 font-mono">Esc</kbd> to close
        </div>
      </div>
    </div>
  )
}

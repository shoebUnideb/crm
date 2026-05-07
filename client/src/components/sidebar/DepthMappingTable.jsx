import React from 'react'

const DEPTH_LABELS = ['0  (Root)', '1', '2', '3+']
const FALLBACK_TYPES = ['Epic', 'Story', 'Task', 'Subtask', 'Initiative']

export default function DepthMappingTable({ depthMap, availableIssueTypes, onChange }) {
  const options = availableIssueTypes.length > 0
    ? availableIssueTypes.map(t => t.name)
    : FALLBACK_TYPES

  const handleChange = (depth, value) => {
    onChange({ ...depthMap, [depth]: value })
  }

  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Depth → Issue Type</h3>
      <div className="space-y-2">
        {[0, 1, 2, 3].map((depth) => (
          <div key={depth} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-12 shrink-0">{DEPTH_LABELS[depth]}</span>
            {availableIssueTypes.length > 0 ? (
              <select
                value={depthMap[depth] || ''}
                onChange={(e) => handleChange(depth, e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {options.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={depthMap[depth] || ''}
                onChange={(e) => handleChange(depth, e.target.value)}
                placeholder="e.g. Epic"
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">Nodes deeper than level 3 use the level-3 type.</p>
    </div>
  )
}

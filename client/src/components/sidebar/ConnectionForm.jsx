import React from 'react'

export default function ConnectionForm({ config, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Jira Base URL</label>
        <input
          type="url"
          value={config.baseUrl}
          onChange={(e) => onChange({ baseUrl: e.target.value.replace(/\/$/, '') })}
          placeholder="https://yourcompany.atlassian.net"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
        <input
          type="email"
          value={config.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="you@company.com"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">API Token</label>
        <input
          type="password"
          value={config.apiToken}
          onChange={(e) => onChange({ apiToken: e.target.value })}
          placeholder="Your Jira API token"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Project Key</label>
        <input
          type="text"
          value={config.projectKey}
          onChange={(e) => onChange({ projectKey: e.target.value.toUpperCase() })}
          placeholder="PROJ"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Project Type</label>
        <select
          value={config.projectType}
          onChange={(e) => onChange({ projectType: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="next-gen">Next-gen (Team-managed)</option>
          <option value="classic">Classic (Company-managed)</option>
        </select>
      </div>
    </div>
  )
}

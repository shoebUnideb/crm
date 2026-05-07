import React, { useState, useEffect } from 'react'
import ConnectionForm from './ConnectionForm.jsx'
import DepthMappingTable from './DepthMappingTable.jsx'
import SuccessOverlay from './SuccessOverlay.jsx'
import { fetchIssueTypes, createTickets, searchJQL, fetchSprints } from '../../lib/jiraApi.js'
import { saveCredentials, loadCredentials } from '../../lib/localStorage.js'
import { trackEvent } from '../../lib/analyticsApi.js'

const DEFAULT_DEPTH_MAP = { 0: 'Epic', 1: 'Story', 2: 'Subtask', 3: 'Subtask' }

export default function JiraPanel({ treeState, userId, onClose, onApplyJiraKeys }) {
  const [config, setConfig] = useState(() => {
    const saved = loadCredentials(userId)
    return {
      baseUrl: saved.baseUrl || '',
      email: saved.email || '',
      apiToken: saved.apiToken || '',
      projectKey: saved.projectKey || '',
      projectType: saved.projectType || 'next-gen',
      depthMap: saved.depthMap || DEFAULT_DEPTH_MAP,
      sprintId: saved.sprintId || '',
    }
  })
  const [availableIssueTypes, setAvailableIssueTypes] = useState([])
  const [availableSprints, setAvailableSprints] = useState([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [isLoadingSprints, setIsLoadingSprints] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [progress, setProgress] = useState(null) // { done, total, current }
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('create') // 'create' | 'import' | 'bulk'
  const [jqlQuery, setJqlQuery] = useState(() => {
    try { return localStorage.getItem(`chart-to-jira-default-jql-${userId}`) || '' } catch { return '' }
  })
  const [jqlResults, setJqlResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [jqlError, setJqlError] = useState(null)
  const [boardId, setBoardId] = useState('')
  const [bulkSelected, setBulkSelected] = useState(new Set())
  const [bulkProgress, setBulkProgress] = useState(null) // { done, total }
  const [bulkError, setBulkError] = useState(null)
  // Feature 29: Push nodes to Jira
  const [pushProjectKey, setPushProjectKey] = useState('')
  const [pushing, setPushing] = useState(false)
  const [pushResults, setPushResults] = useState([])

  useEffect(() => {
    saveCredentials(config, userId)
  }, [config, userId])

  const updateConfig = (updates) => setConfig(c => ({ ...c, ...updates }))
  const isConfigured = config.baseUrl && config.email && config.apiToken && config.projectKey

  const handleFetchIssueTypes = async () => {
    setIsLoadingTypes(true)
    setError(null)
    try {
      const types = await fetchIssueTypes(config)
      setAvailableIssueTypes(types)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const handleFetchSprints = async () => {
    if (!boardId.trim()) { setError('Enter a Board ID to fetch sprints'); return }
    setIsLoadingSprints(true)
    setError(null)
    try {
      const sprints = await fetchSprints({ ...config, boardId: boardId.trim() })
      setAvailableSprints(sprints)
      // Auto-select active sprint if setting is enabled
      try {
        const autoSelect = localStorage.getItem(`chart-to-jira-sprint-autoselect-${userId}`) === '1'
        if (autoSelect) {
          const active = sprints.find(s => s.state === 'active')
          if (active) updateConfig({ sprintId: String(active.id) })
        }
      } catch {}
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoadingSprints(false)
    }
  }

  const handleMakeTickets = async () => {
    trackEvent('feature_used', 'jira_create_tickets', userId)
    setIsCreating(true)
    setError(null)
    setResult(null)
    const nodeCount = Object.keys(treeState.nodes).length
    setProgress({ done: 0, total: nodeCount, current: 'Starting…' })
    try {
      const response = await createTickets({ jira: config, tree: treeState })
      setResult(response)
      // Apply jira keys to nodes for two-way sync
      if (response.keyMap && onApplyJiraKeys) {
        onApplyJiraKeys(response.keyMap)
      }
      setProgress(null)
    } catch (err) {
      setError(err.message)
      setProgress(null)
    } finally {
      setIsCreating(false)
    }
  }

  const handleJqlSearch = async () => {
    if (!jqlQuery.trim()) return
    setIsSearching(true)
    setJqlError(null)
    setJqlResults([])
    try {
      const issues = await searchJQL({ ...config, jql: jqlQuery })
      setJqlResults(issues)
    } catch (err) {
      setJqlError(err.message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleImportJqlResults = () => {
    if (jqlResults.length === 0) return
    window.dispatchEvent(new CustomEvent('jira-import-nodes', { detail: { issues: jqlResults } }))
    setJqlResults([])
    setJqlQuery('')
  }

  const noKeyNodes = Object.values(treeState.nodes).filter(n => !n.jiraKey)

  // Feature 29: Push nodes to Jira via REST
  async function pushNodesToJira() {
    const domain = config.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const email = config.email
    const token = config.apiToken
    if (!domain || !email || !token || !pushProjectKey) {
      alert('Please configure domain, email, token, and project key first.')
      return
    }
    const nodesToPush = Object.values(treeState.nodes).filter(n =>
      n.parentId !== null && // skip root
      !n.jiraKey            // skip already-linked nodes
    )
    if (nodesToPush.length === 0) { alert('No nodes to push (all already have Jira keys)'); return }
    if (!window.confirm(`Create ${nodesToPush.length} Jira issues in project ${pushProjectKey}?`)) return

    setPushing(true)
    const results = []
    const keyMap = {}

    for (const node of nodesToPush) {
      try {
        const body = {
          fields: {
            project: { key: pushProjectKey },
            summary: node.title,
            issuetype: { name: node.issueType ? (node.issueType.charAt(0).toUpperCase() + node.issueType.slice(1)) : 'Task' },
          }
        }
        if (node.notes) {
          body.fields.description = { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: node.notes }] }] }
        }

        const resp = await fetch(`https://${domain}/rest/api/3/issue`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(email + ':' + token)}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(body),
        })

        if (resp.ok) {
          const data = await resp.json()
          keyMap[node.id] = data.key
          results.push({ title: node.title, key: data.key, success: true })
        } else {
          const err = await resp.text()
          results.push({ title: node.title, success: false, error: err.slice(0, 100) })
        }
      } catch (err) {
        results.push({ title: node.title, success: false, error: err.message })
      }
    }

    if (Object.keys(keyMap).length > 0) {
      onApplyJiraKeys?.(keyMap)
    }

    setPushResults(results)
    setPushing(false)
  }

  const handleBulkCreate = async () => {
    if (bulkSelected.size === 0) return
    setBulkError(null)
    const selectedNodes = noKeyNodes.filter(n => bulkSelected.has(n.id))
    setBulkProgress({ done: 0, total: selectedNodes.length })
    const keyMap = {}
    for (let i = 0; i < selectedNodes.length; i++) {
      const node = selectedNodes[i]
      setBulkProgress({ done: i, total: selectedNodes.length })
      try {
        const subTree = {
          nodes: { [node.id]: node, [treeState.rootId]: treeState.nodes[treeState.rootId] },
          rootId: treeState.rootId,
          extraEdges: [],
          groups: [],
          customStatuses: [],
        }
        const resp = await createTickets({ jira: config, tree: subTree })
        if (resp?.keyMap) Object.assign(keyMap, resp.keyMap)
        await new Promise(r => setTimeout(r, 300))
      } catch (err) {
        setBulkError(`Failed on "${node.title}": ${err.message}`)
        break
      }
    }
    if (Object.keys(keyMap).length > 0 && onApplyJiraKeys) {
      onApplyJiraKeys(keyMap)
    }
    setBulkProgress({ done: selectedNodes.length, total: selectedNodes.length })
    setTimeout(() => { setBulkProgress(null); setBulkSelected(new Set()) }, 1500)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(9,30,66,0.35)',
        }}
      />

      {/* Dialog */}
      <aside style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 480, maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'calc(100vh - 64px)',
        zIndex: 51,
        background: '#fff', borderRadius: 12,
        boxShadow: '0 8px 40px rgba(9,30,66,0.22)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between" style={{ flexShrink: 0 }}>
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">Jira Integration</h2>
          <p className="text-xs text-gray-400 mt-0.5">Credentials saved locally in your browser</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-lg leading-none ml-3 shrink-0"
            title="Close"
          >
            ×
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4 shrink-0">
        {[['create', 'Create Tickets'], ['import', 'JQL Import'], ['bulk', 'Bulk Create']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`py-2.5 px-1 mr-4 text-xs font-medium border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <ConnectionForm config={config} onChange={updateConfig} />

            {/* Sprint assignment */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sprint Assignment (optional)</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={boardId}
                  onChange={e => setBoardId(e.target.value)}
                  placeholder="Board ID"
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleFetchSprints}
                  disabled={isLoadingSprints || !isConfigured}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  {isLoadingSprints ? '…' : 'Get Sprints'}
                </button>
              </div>
              {availableSprints.length > 0 && (
                <select
                  value={config.sprintId}
                  onChange={e => updateConfig({ sprintId: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">No sprint</option>
                  {availableSprints.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.state})</option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={handleFetchIssueTypes}
              disabled={isLoadingTypes || !isConfigured}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLoadingTypes ? 'Fetching…' : 'Fetch Issue Types from Jira'}
            </button>

            <DepthMappingTable
              depthMap={config.depthMap}
              availableIssueTypes={availableIssueTypes}
              onChange={(depthMap) => updateConfig({ depthMap })}
            />

            {/* Two-way sync status */}
            {(() => {
              const synced = Object.values(treeState.nodes).filter(n => n.jiraKey).length
              if (synced === 0) return null
              return (
                <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-2">
                  <span>✓</span>
                  <span>{synced} node{synced !== 1 ? 's' : ''} synced with Jira</span>
                </div>
              )
            })()}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 break-words">
                {error}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleMakeTickets}
              disabled={isCreating || !isConfigured}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Creating tickets…' : 'Make Tickets in Jira'}
            </button>
          </div>
        </>
      )}

      {activeTab === 'import' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              Configure Jira credentials in the Create tab first.
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">JQL Query</div>
            <textarea
              value={jqlQuery}
              onChange={e => setJqlQuery(e.target.value)}
              placeholder={'e.g. project = MYPROJ AND sprint in openSprints() AND status != Done'}
              rows={3}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg resize-none font-mono"
            />
            <button
              onClick={handleJqlSearch}
              disabled={isSearching || !isConfigured || !jqlQuery.trim()}
              className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Searching…' : 'Search Jira'}
            </button>
          </div>

          {jqlError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 break-words">
              {jqlError}
            </div>
          )}

          {jqlResults.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {jqlResults.length} issue{jqlResults.length !== 1 ? 's' : ''} found
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {jqlResults.map(issue => (
                  <div key={issue.key} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                    <span className="font-mono text-xs text-blue-600 shrink-0 mt-0.5">{issue.key}</span>
                    <span className="text-xs text-gray-700 flex-1">{issue.summary}</span>
                    {issue.status && (
                      <span className="text-xs text-gray-400 shrink-0">{issue.status}</span>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleImportJqlResults}
                className="w-full px-4 py-2 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Import {jqlResults.length} issues as nodes
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isConfigured && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              Configure Jira credentials in the Create tab first.
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Nodes without Jira key ({noKeyNodes.length})
            </div>
            {noKeyNodes.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">All nodes already have Jira keys</div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setBulkSelected(new Set(noKeyNodes.map(n => n.id)))}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >Select all</button>
                  <span className="text-gray-300">·</span>
                  <button
                    onClick={() => setBulkSelected(new Set())}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >Deselect all</button>
                  <span className="text-xs text-gray-400 ml-auto">{bulkSelected.size} selected</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-1.5">
                  {noKeyNodes.map(n => (
                    <div key={n.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={bulkSelected.has(n.id)}
                        onChange={() => setBulkSelected(prev => {
                          const next = new Set(prev)
                          next.has(n.id) ? next.delete(n.id) : next.add(n.id)
                          return next
                        })}
                        className="w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-xs text-gray-700 flex-1 truncate">{n.title}</span>
                      {n.status && <span className="text-xs text-gray-400 shrink-0">{n.status}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {bulkProgress && (
            <div className="space-y-1.5">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.done / bulkProgress.total) * 100 : 5}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-center">{bulkProgress.done} / {bulkProgress.total} created</div>
            </div>
          )}

          {bulkError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{bulkError}</div>
          )}

          <button
            onClick={handleBulkCreate}
            disabled={bulkSelected.size === 0 || !isConfigured || bulkProgress != null}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {bulkProgress ? `Creating… (${bulkProgress.done}/${bulkProgress.total})` : `Create ${bulkSelected.size} selected in Jira`}
          </button>
        </div>
      )}
      {/* Feature 29: Push Nodes → Jira section */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Push Nodes → Jira</div>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 8 }}>Create Jira issues from nodes that don't have a key yet.</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            value={pushProjectKey}
            onChange={e => setPushProjectKey(e.target.value.toUpperCase())}
            placeholder="Project key (e.g. ABC)"
            style={{ flex: 1, fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6, padding: '5px 8px', outline: 'none' }}
          />
          <button
            onClick={pushNodesToJira}
            disabled={pushing || !pushProjectKey}
            style={{ background: pushing ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: pushing ? 'default' : 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            {pushing ? 'Pushing…' : 'Push to Jira'}
          </button>
        </div>
        {pushResults.length > 0 && (
          <div style={{ maxHeight: 150, overflowY: 'auto', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {pushResults.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px', borderRadius: 4, background: r.success ? '#F0FDF4' : '#FEF2F2' }}>
                <span style={{ color: r.success ? '#16A34A' : '#DC2626', fontWeight: 700 }}>{r.success ? '✓' : '✗'}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                {r.success && <span style={{ color: '#2563EB', fontWeight: 600, fontFamily: 'monospace' }}>{r.key}</span>}
                {!r.success && <span style={{ color: '#DC2626' }}>Failed</span>}
              </div>
            ))}
          </div>
        )}
      </div>
      {isCreating && progress && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, zIndex: 50,
        }}>
          <div style={{ fontSize: '24px' }}>🚀</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Creating Jira Tickets</div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>{progress.current}</div>
          <div style={{ width: 200, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 30}%`,
              height: '100%', background: '#3B82F6', borderRadius: 3,
              transition: 'width 0.3s ease',
              animation: progress.done === 0 ? 'pulse 1.5s ease-in-out infinite' : undefined,
            }} />
          </div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
            {progress.done > 0 ? `${progress.done} / ${progress.total}` : `Creating ${progress.total} tickets…`}
          </div>
        </div>
      )}

      {result?.tickets && (
        <SuccessOverlay
          tickets={result.tickets}
          baseUrl={config.baseUrl}
          onClose={() => setResult(null)}
        />
      )}
      </aside>
    </>
  )
}

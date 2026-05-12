import React, { useState } from 'react'
import { PIPELINE_CATEGORIES, PIPELINE_TEMPLATES } from '../../lib/pipelineTemplates.js'
import { useApplyPipelineTemplate } from '../../hooks/useApplyPipelineTemplate.js'

const NAVY = '#172B4D', SUBTLE = '#5E6C84', BORDER = '#DFE1E6', WHITE = '#fff', BLUE = '#0052CC', EMERALD = '#10b981'

export default function PipelineTemplatesPanel() {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState(null)
  const [includeSamples, setIncludeSamples] = useState(true)
  const [applied, setApplied] = useState(new Set())
  const { apply, applying, progress, error, reset } = useApplyPipelineTemplate()

  const filtered = PIPELINE_TEMPLATES.filter(t => {
    if (category !== 'all' && t.category !== category) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleApply(template) {
    const pipeline = await apply(template, { includeSampleDeals: includeSamples })
    if (pipeline) {
      setApplied(prev => new Set([...prev, template.id]))
      setTimeout(() => { setPreview(null); reset() }, 1500)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 14, color: NAVY }}>Pipeline Templates</h4>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: SUBTLE }}>Start with a pre-built pipeline tailored to your use case</p>
        </div>
        <input
          placeholder="Search templates..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '6px 10px', border: `1.5px solid ${BORDER}`, borderRadius: 6, fontSize: 11, width: 180, outline: 'none' }}
        />
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setCategory('all')}
          style={{ padding: '5px 12px', borderRadius: 20, border: category === 'all' ? `2px solid ${BLUE}` : `1px solid ${BORDER}`, background: category === 'all' ? '#DEEBFF' : WHITE, color: category === 'all' ? BLUE : SUBTLE, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
        >
          All ({PIPELINE_TEMPLATES.length})
        </button>
        {PIPELINE_CATEGORIES.map(cat => {
          const count = PIPELINE_TEMPLATES.filter(t => t.category === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{ padding: '5px 12px', borderRadius: 20, border: category === cat.id ? `2px solid ${cat.color}` : `1px solid ${BORDER}`, background: category === cat.id ? `${cat.color}15` : WHITE, color: category === cat.id ? cat.color : SUBTLE, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              {cat.icon} {cat.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Template grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {filtered.map(t => {
          const cat = PIPELINE_CATEGORIES.find(c => c.id === t.category)
          const isApplied = applied.has(t.id)
          return (
            <div key={t.id} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, padding: 14, background: WHITE, position: 'relative', transition: 'box-shadow 0.2s', cursor: 'pointer' }} onClick={() => setPreview(t)}>
              {isApplied && <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, background: '#E3FCEF', color: '#006644', padding: '2px 6px', borderRadius: 10, fontWeight: 600 }}>Applied</div>}
              <div style={{ fontSize: 22, marginBottom: 8 }}>{t.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 10, color: SUBTLE, marginBottom: 8, lineHeight: 1.4, minHeight: 28 }}>{t.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: cat?.color || SUBTLE, fontWeight: 600 }}>{cat?.label}</span>
                <span style={{ fontSize: 9, color: SUBTLE }}>{t.stages.length} stages</span>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: SUBTLE, fontSize: 12 }}>
          No templates match your search
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setPreview(null); reset() }}>
          <div style={{ background: WHITE, borderRadius: 12, width: 560, maxHeight: '80vh', overflow: 'auto', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{preview.icon}</div>
                <h3 style={{ margin: 0, fontSize: 16, color: NAVY }}>{preview.name}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: SUBTLE }}>{preview.description}</p>
              </div>
              <button onClick={() => { setPreview(null); reset() }} style={{ background: 'none', border: 'none', fontSize: 20, color: SUBTLE, cursor: 'pointer' }}>×</button>
            </div>

            {/* Stages */}
            <div style={{ marginBottom: 16 }}>
              <h5 style={{ margin: '0 0 8px', fontSize: 11, color: NAVY, fontWeight: 700 }}>Stages ({preview.stages.length})</h5>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {preview.stages.map((s, i) => (
                  <div key={i} style={{ padding: '4px 10px', borderRadius: 12, background: s.bg_color || '#F4F5F7', border: `1px solid ${s.border_color || BORDER}`, color: s.color || NAVY, fontSize: 10, fontWeight: 600 }}>
                    {s.label} {s.probability != null && <span style={{ fontWeight: 400, opacity: 0.7 }}>({s.probability}%)</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Sample deals */}
            {preview.sampleDeals && preview.sampleDeals.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h5 style={{ margin: '0 0 8px', fontSize: 11, color: NAVY, fontWeight: 700 }}>Sample Deals ({preview.sampleDeals.length})</h5>
                <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <th style={{ textAlign: 'left', padding: '4px 6px', color: SUBTLE, fontWeight: 600 }}>Company</th>
                      <th style={{ textAlign: 'left', padding: '4px 6px', color: SUBTLE, fontWeight: 600 }}>Contact</th>
                      <th style={{ textAlign: 'right', padding: '4px 6px', color: SUBTLE, fontWeight: 600 }}>Value</th>
                      <th style={{ textAlign: 'left', padding: '4px 6px', color: SUBTLE, fontWeight: 600 }}>Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleDeals.map((d, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid #F4F5F7` }}>
                        <td style={{ padding: '5px 6px', color: NAVY, fontWeight: 600 }}>{d.company_name}</td>
                        <td style={{ padding: '5px 6px', color: SUBTLE }}>{d.contact_name}</td>
                        <td style={{ padding: '5px 6px', color: EMERALD, fontWeight: 700, textAlign: 'right' }}>${(d.deal_value || 0).toLocaleString()}</td>
                        <td style={{ padding: '5px 6px', color: SUBTLE }}>{d.stage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Apply controls */}
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: 11, color: SUBTLE, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={includeSamples} onChange={e => setIncludeSamples(e.target.checked)} style={{ accentColor: BLUE }} />
                Include sample deals
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {error && <span style={{ fontSize: 10, color: '#BF2600' }}>{error}</span>}
                {progress && progress.step === 'done' && <span style={{ fontSize: 10, color: EMERALD, fontWeight: 600 }}>Pipeline created!</span>}
                {progress && progress.step !== 'done' && (
                  <span style={{ fontSize: 10, color: SUBTLE }}>
                    {progress.step === 'stages' ? 'Creating stages' : 'Adding deals'}... {progress.current}/{progress.total}
                  </span>
                )}
                <button
                  onClick={() => handleApply(preview)}
                  disabled={applying || applied.has(preview.id)}
                  style={{ padding: '8px 18px', background: applied.has(preview.id) ? EMERALD : BLUE, color: WHITE, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: applying ? 'wait' : 'pointer', opacity: applying ? 0.7 : 1 }}
                >
                  {applied.has(preview.id) ? 'Applied' : applying ? 'Applying...' : 'Use This Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

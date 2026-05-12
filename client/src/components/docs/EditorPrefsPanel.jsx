import React from 'react'
import { DEFAULT_PREFS } from '../../hooks/useEditorPrefs.js'

export default function EditorPrefsPanel({ prefs, setPrefs, onReset }) {
  const set = (key, val) => setPrefs({ [key]: val })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 20px' }}>

      <Section title="Typography">
        <Row label="Font size" value={prefs.fontSize} min={0.5} max={1.2} step={0.01} unit="rem"
          onChange={v => set('fontSize', v)} def={DEFAULT_PREFS.fontSize} />
        <Row label="Line height" value={prefs.lineHeight} min={1.0} max={2.5} step={0.05} unit=""
          onChange={v => set('lineHeight', v)} def={DEFAULT_PREFS.lineHeight} />
      </Section>

      <Section title="Title">
        <Row label="Size" value={prefs.titleSize} min={0.8} max={2.5} step={0.05} unit="rem"
          onChange={v => set('titleSize', v)} def={DEFAULT_PREFS.titleSize} />
        <Row label="Bottom margin" value={prefs.titleMarginBottom} min={0} max={24} step={1} unit="px"
          onChange={v => set('titleMarginBottom', v)} def={DEFAULT_PREFS.titleMarginBottom} />
      </Section>

      <Section title="Headings">
        <Row label="H1 size" value={prefs.h1Size} min={0.6} max={2.0} step={0.02} unit="rem"
          onChange={v => set('h1Size', v)} def={DEFAULT_PREFS.h1Size} />
        <Row label="H2 size" value={prefs.h2Size} min={0.5} max={1.8} step={0.02} unit="rem"
          onChange={v => set('h2Size', v)} def={DEFAULT_PREFS.h2Size} />
        <Row label="H3 size" value={prefs.h3Size} min={0.5} max={1.5} step={0.02} unit="rem"
          onChange={v => set('h3Size', v)} def={DEFAULT_PREFS.h3Size} />
        <Row label="Spacing ×" value={prefs.headingSpacing} min={0} max={3} step={0.05} unit="×"
          onChange={v => set('headingSpacing', v)} def={DEFAULT_PREFS.headingSpacing} />
      </Section>

      <Section title="Content">
        <Row label="Para spacing" value={prefs.paraSpacing} min={0} max={1.5} step={0.05} unit="em"
          onChange={v => set('paraSpacing', v)} def={DEFAULT_PREFS.paraSpacing} />
        <Row label="List indent" value={prefs.listIndent} min={0.5} max={3} step={0.1} unit="em"
          onChange={v => set('listIndent', v)} def={DEFAULT_PREFS.listIndent} />
        <Row label="Item gap" value={prefs.listItemSpacing} min={0} max={0.8} step={0.02} unit="em"
          onChange={v => set('listItemSpacing', v)} def={DEFAULT_PREFS.listItemSpacing} />
      </Section>

      <Section title="Table">
        <Row label="Cell pad (V)" value={prefs.cellPadV} min={1} max={20} step={1} unit="px"
          onChange={v => set('cellPadV', v)} def={DEFAULT_PREFS.cellPadV} />
        <Row label="Cell pad (H)" value={prefs.cellPadH} min={2} max={32} step={1} unit="px"
          onChange={v => set('cellPadH', v)} def={DEFAULT_PREFS.cellPadH} />
        <ToggleRow label="Col sizing" value={prefs.tableLayout}
          options={['auto', 'fixed']} labels={['Flexible', 'Fixed']}
          onChange={v => set('tableLayout', v)} />
      </Section>

      <Section title="Dividers & Blocks">
        <Row label="Blockquote pad" value={prefs.blockquotePadV} min={0} max={1.5} step={0.05} unit="em"
          onChange={v => set('blockquotePadV', v)} def={DEFAULT_PREFS.blockquotePadV} />
        <Row label="Code block pad" value={prefs.codePadV} min={0.1} max={2} step={0.05} unit="em"
          onChange={v => set('codePadV', v)} def={DEFAULT_PREFS.codePadV} />
        <Row label="HR margin" value={prefs.hrMargin} min={0.1} max={2.5} step={0.05} unit="em"
          onChange={v => set('hrMargin', v)} def={DEFAULT_PREFS.hrMargin} />
        <Row label="Callout pad" value={prefs.calloutPadV} min={1} max={24} step={1} unit="px"
          onChange={v => set('calloutPadV', v)} def={DEFAULT_PREFS.calloutPadV} />
      </Section>

      <Section title="Page Layout">
        <Row label="Top" value={prefs.pagePadTop} min={0} max={80} step={2} unit="px"
          onChange={v => set('pagePadTop', v)} def={DEFAULT_PREFS.pagePadTop} />
        <Row label="Right" value={prefs.pagePadRight} min={8} max={120} step={4} unit="px"
          onChange={v => set('pagePadRight', v)} def={DEFAULT_PREFS.pagePadRight} />
        <Row label="Bottom" value={prefs.pagePadBottom} min={16} max={120} step={4} unit="px"
          onChange={v => set('pagePadBottom', v)} def={DEFAULT_PREFS.pagePadBottom} />
        <Row label="Left" value={prefs.pagePadLeft} min={8} max={120} step={4} unit="px"
          onChange={v => set('pagePadLeft', v)} def={DEFAULT_PREFS.pagePadLeft} />
      </Section>

      <button
        onClick={onReset}
        style={{
          marginTop: 8, width: '100%', padding: '6px', border: '1px solid #DFE1E6',
          borderRadius: 5, background: 'none', cursor: 'pointer', fontSize: '0.6875rem',
          color: '#5E6C84', fontWeight: 500,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F4F5F7' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
      >
        Reset to defaults
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ margin: '0 0 6px', fontSize: '0.625rem', fontWeight: 700, color: '#97A0AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

function Row({ label, value, min, max, step, unit, onChange, def }) {
  const isDefault = value === def
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : 2
  const display = typeof value === 'number' ? value.toFixed(decimals) : value

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <span style={{ width: 96, fontSize: '0.6875rem', color: '#5E6C84', flexShrink: 0 }}>{label}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, height: 3, accentColor: '#0052CC' }}
      />
      <span
        style={{
          width: 46, fontSize: '0.6875rem', textAlign: 'right', flexShrink: 0,
          color: isDefault ? '#B3BAC5' : '#0052CC', fontWeight: isDefault ? 400 : 600,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {display}{unit !== '×' ? ` ${unit}` : unit}
      </span>
    </div>
  )
}

function ToggleRow({ label, value, options, labels, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <span style={{ width: 96, fontSize: '0.6875rem', color: '#5E6C84', flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map((opt, i) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '2px 8px', borderRadius: 4, border: '1px solid',
              borderColor: value === opt ? '#0052CC' : '#DFE1E6',
              background: value === opt ? '#DEEBFF' : '#fff',
              color: value === opt ? '#0052CC' : '#5E6C84',
              fontSize: '0.6875rem', cursor: 'pointer', fontWeight: value === opt ? 600 : 400,
            }}
          >
            {labels[i]}
          </button>
        ))}
      </div>
    </div>
  )
}

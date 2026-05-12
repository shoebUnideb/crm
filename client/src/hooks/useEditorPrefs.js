import { useState } from 'react'

const STORAGE_KEY = 'docsEditorPrefs'

// Defaults match the current compact layout
export const DEFAULT_PREFS = {
  // Typography
  fontSize: 0.7,            // rem — base body text
  lineHeight: 1.2,

  // Title
  titleSize: 1.2,           // rem
  titleMarginBottom: 3,     // px

  // Headings (margins are em so they scale with font size; headingSpacing is a multiplier)
  h1Size: 1.0,              // rem
  h2Size: 0.84,             // rem
  h3Size: 0.75,             // rem
  headingSpacing: 1.0,      // multiplier on heading top/bottom margins

  // Content spacing
  paraSpacing: 0.2,         // em — paragraph bottom margin
  listIndent: 1.0,          // em — list padding-left
  listItemSpacing: 0.08,    // em — li margin-bottom

  // Table
  cellPadV: 4,              // px
  cellPadH: 6,              // px
  tableLayout: 'auto',      // 'auto' | 'fixed'

  // Block elements
  blockquotePadV: 0.2,      // em — blockquote top/bottom (left = ×3)
  codePadV: 0.48,           // em — code block top/bottom (H = ×1.67)
  hrMargin: 0.52,           // em
  calloutPadV: 5,           // px (H = ×2, left = ×1.6)

  // Page layout
  pagePadTop: 16,           // px
  pagePadRight: 32,         // px
  pagePadBottom: 48,        // px
  pagePadLeft: 38,          // px
}

export function useEditorPrefs() {
  const [prefs, setPrefsState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) }
    } catch {}
    return DEFAULT_PREFS
  })

  function setPrefs(updates) {
    setPrefsState(prev => {
      const next = { ...prev, ...updates }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function resetPrefs() {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setPrefsState(DEFAULT_PREFS)
  }

  return { prefs, setPrefs, resetPrefs }
}

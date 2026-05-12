import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'

// ── Slash command items ──────────────────────────────────────────────────────
export function getSlashItems(query) {
  const ALL = [
    { title: 'Heading 1',      icon: 'H1', desc: 'Large section heading',   cmd: e => e.chain().focus().toggleHeading({ level: 1 }).run() },
    { title: 'Heading 2',      icon: 'H2', desc: 'Medium section heading',  cmd: e => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { title: 'Heading 3',      icon: 'H3', desc: 'Small section heading',   cmd: e => e.chain().focus().toggleHeading({ level: 3 }).run() },
    { title: 'Bullet list',    icon: '•—', desc: 'Unordered list',          cmd: e => e.chain().focus().toggleBulletList().run() },
    { title: 'Numbered list',  icon: '1.', desc: 'Ordered list',            cmd: e => e.chain().focus().toggleOrderedList().run() },
    { title: 'Task list',      icon: '☑', desc: 'Checklist with checkboxes', cmd: e => e.chain().focus().toggleTaskList().run() },
    { title: 'Table',          icon: '⊞', desc: '3×3 table',               cmd: e => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { title: 'Code block',     icon: '</>', desc: 'Code with syntax highlight', cmd: e => e.chain().focus().toggleCodeBlock().run() },
    { title: 'Blockquote',     icon: '"', desc: 'Indented quote',           cmd: e => e.chain().focus().toggleBlockquote().run() },
    { title: 'Info callout',   icon: 'ℹ️', desc: 'Blue information panel',  cmd: e => e.chain().focus().toggleCallout('info').run() },
    { title: 'Tip callout',    icon: '💡', desc: 'Green tip panel',         cmd: e => e.chain().focus().toggleCallout('tip').run() },
    { title: 'Warning callout',icon: '⚠️', desc: 'Yellow warning panel',   cmd: e => e.chain().focus().toggleCallout('warning').run() },
    { title: 'Error callout',  icon: '🚨', desc: 'Red error/danger panel',  cmd: e => e.chain().focus().toggleCallout('error').run() },
    { title: 'Divider',        icon: '—', desc: 'Horizontal rule',          cmd: e => e.chain().focus().setHorizontalRule().run() },
  ]
  if (!query) return ALL
  const q = query.toLowerCase()
  return ALL.filter(i => i.title.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
}

// ── Dropdown component ────────────────────────────────────────────────────────
const SlashMenu = forwardRef(({ items, command }, ref) => {
  const [selected, setSelected] = useState(0)

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (event.key === 'ArrowUp') {
        setSelected(s => (s - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelected(s => (s + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        command(items[selected])
        return true
      }
      return false
    },
  }))

  // Reset selection when items change
  useEffect(() => { setSelected(0) }, [items])

  if (!items.length) return null

  return (
    <div style={{
      background: '#fff', border: '1px solid #DFE1E6', borderRadius: 8,
      boxShadow: '0 8px 24px rgba(9,30,66,0.18)', padding: 4,
      minWidth: 260, maxHeight: 320, overflow: 'auto', zIndex: 1000,
    }}>
      {items.map((item, i) => (
        <button
          key={item.title}
          onMouseDown={e => { e.preventDefault(); command(item) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '7px 10px', borderRadius: 5, border: 'none', cursor: 'pointer',
            background: i === selected ? '#F4F5F7' : 'transparent',
            textAlign: 'left',
          }}
          onMouseEnter={() => setSelected(i)}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 5, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#EBECF0', fontSize: '0.75rem', fontWeight: 700, color: '#172B4D',
            fontFamily: 'monospace',
          }}>
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#172B4D' }}>{item.title}</div>
            <div style={{ fontSize: '0.6875rem', color: '#97A0AF' }}>{item.desc}</div>
          </div>
        </button>
      ))}
    </div>
  )
})
SlashMenu.displayName = 'SlashMenu'

// ── Tiptap extension ─────────────────────────────────────────────────────────
export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run()
          props.cmd(editor)
        },
        items: ({ query }) => getSlashItems(query),
        render: () => {
          let component
          let popup

          function position(props) {
            const { clientRect } = props
            if (!clientRect) return
            const rect = clientRect()
            if (!rect) return
            popup.style.left = rect.left + 'px'
            popup.style.top = (rect.bottom + 4) + 'px'
          }

          // Reposition when the editor's scroll container scrolls
          let scrollParent = null
          function onScroll() { if (component && popup) position(component.props || {}) }

          return {
            onStart(props) {
              component = new ReactRenderer(SlashMenu, {
                props,
                editor: props.editor,
              })

              popup = document.createElement('div')
              popup.style.cssText = 'position:fixed;z-index:9999;'
              document.body.appendChild(popup)

              position(props)

              if (component.element) {
                popup.appendChild(component.element)
              }

              // Attach scroll listener to reposition popup
              let el = props.editor.view.dom.parentElement
              while (el && el !== document.body) {
                const s = getComputedStyle(el)
                if (s.overflow === 'auto' || s.overflowY === 'auto' || s.overflow === 'scroll') {
                  scrollParent = el
                  break
                }
                el = el.parentElement
              }
              if (scrollParent) scrollParent.addEventListener('scroll', onScroll, { passive: true })
            },

            onUpdate(props) {
              component.updateProps(props)
              position(props)
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup.style.display = 'none'
                return true
              }
              return component.ref?.onKeyDown(props) ?? false
            },

            onExit() {
              if (scrollParent) scrollParent.removeEventListener('scroll', onScroll)
              scrollParent = null
              if (popup && popup.parentNode) popup.parentNode.removeChild(popup)
              component?.destroy()
              component = null
              popup = null
            },
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

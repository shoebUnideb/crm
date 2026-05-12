import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import CharacterCount from '@tiptap/extension-character-count'
import { createLowlight, common } from 'lowlight'
import { Callout } from './CalloutExtension.js'
import { SlashCommands } from './SlashCommands.jsx'
import NodeDragHandle from './NodeDragHandle.jsx'
import EditorPrefsPanel from './EditorPrefsPanel.jsx'
import { useEditorPrefs } from '../../hooks/useEditorPrefs.js'
import * as docsApi from '../../lib/docsApi.js'
import PageComments from './PageComments.jsx'
import PageVersionHistory from './PageVersionHistory.jsx'
import PageRestrictions from './PageRestrictions.jsx'

const ACCENT = '#172B4D'
const lowlight = createLowlight(common)

function buildEditorCss(p, accent) {
  const hs = p.headingSpacing
  const f = n => n.toFixed(3).replace(/\.?0+$/, '')
  return `
    .tiptap-editor { outline: none; font-size: ${p.fontSize}rem; line-height: ${p.lineHeight}; color: #172B4D; min-height: 60vh; }
    .tiptap-editor h1 { font-size: ${p.h1Size}rem; font-weight: 700; margin: ${f(0.68*hs)}em 0 ${f(0.2*hs)}em; }
    .tiptap-editor h2 { font-size: ${p.h2Size}rem; font-weight: 700; margin: ${f(0.6*hs)}em 0 ${f(0.16*hs)}em; color: #172B4D; }
    .tiptap-editor h3 { font-size: ${p.h3Size}rem; font-weight: 600; margin: ${f(0.48*hs)}em 0 ${f(0.12*hs)}em; }
    .tiptap-editor p { margin: 0 0 ${p.paraSpacing}em; }
    .tiptap-editor ul, .tiptap-editor ol { padding-left: ${p.listIndent}em; margin: 0 0 ${p.paraSpacing}em; }
    .tiptap-editor li { margin-bottom: ${p.listItemSpacing}em; }
    .tiptap-editor blockquote { border-left: 3px solid ${accent}; padding: ${p.blockquotePadV}em 0 ${p.blockquotePadV}em ${f(p.blockquotePadV*3)}em; margin: ${f(p.blockquotePadV*1.2)}em 0; color: #5E6C84; background: #EAF3FF; border-radius: 0 4px 4px 0; }
    .tiptap-editor code { background: #F4F5F7; padding: 0.1em 0.3em; border-radius: 3px; font-size: 0.875em; }
    .tiptap-editor pre { background: #172B4D; color: #F4F5F7; padding: ${p.codePadV}em ${f(p.codePadV*1.67)}em; border-radius: 8px; overflow-x: auto; margin: ${f(p.codePadV*0.5)}em 0; }
    .tiptap-editor pre code { background: none; padding: 0; font-size: 0.875em; }
    .tiptap-editor table { border-collapse: collapse; width: 100%; margin: ${f(p.cellPadV*0.06)}em 0 ${f(p.cellPadV*0.12)}em; table-layout: ${p.tableLayout}; }
    .tiptap-editor th, .tiptap-editor td { border: 1px solid #DFE1E6; padding: ${p.cellPadV}px ${p.cellPadH}px; text-align: left; vertical-align: top; min-width: ${p.cellPadH*8}px; }
    .tiptap-editor th { background: #F4F5F7; font-weight: 600; font-size: ${f(p.fontSize*0.93)}rem; }
    .tiptap-editor td { background: #fff; }
    .tiptap-editor tr:hover td { background: #FAFBFC; }
    .tiptap-editor .selectedCell:after { background: rgba(245,158,11,0.15); content: ""; left: 0; right: 0; top: 0; bottom: 0; pointer-events: none; position: absolute; z-index: 2; }
    .tiptap-editor ul[data-type="taskList"] { list-style: none; padding-left: 0.25em; }
    .tiptap-editor ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: ${Math.max(2, Math.round(p.cellPadV*0.67))}px; }
    .tiptap-editor ul[data-type="taskList"] li > label { margin-top: 1px; }
    .tiptap-editor a { color: ${accent}; text-decoration: underline; }
    .tiptap-editor img { max-width: 100%; border-radius: 6px; margin: ${f(p.blockquotePadV*2)}em 0; }
    .tiptap-editor .is-editor-empty:first-child::before { content: attr(data-placeholder); color: #B3BAC5; pointer-events: none; float: left; height: 0; }
    .tiptap-editor hr { border: none; border-top: 1px solid #DFE1E6; margin: ${p.hrMargin}em 0; }
    .tiptap-editor > p:hover, .tiptap-editor > h1:hover, .tiptap-editor > h2:hover, .tiptap-editor > h3:hover,
    .tiptap-editor > ul:hover, .tiptap-editor > ol:hover, .tiptap-editor > blockquote:hover,
    .tiptap-editor > pre:hover, .tiptap-editor > div[data-callout]:hover { background: rgba(9,30,66,0.025); border-radius: 4px; }
    .ProseMirror-dropcursor { border-top: 2px solid ${accent}; }
    .ProseMirror-selectednode { outline: 2px solid ${accent}; border-radius: 4px; }
    .tiptap-editor div[data-callout] { position: relative; border-left: 4px solid transparent; padding: ${p.calloutPadV}px ${p.calloutPadV*2}px ${p.calloutPadV}px ${Math.round(p.calloutPadV*1.6)}px; margin: ${f(p.calloutPadV*0.048)}em 0; }
    .tiptap-editor div[data-callout][data-type="info"]    { background: #EFF8FF; border-left-color: #3B82F6; }
    .tiptap-editor div[data-callout][data-type="tip"]     { background: #F0FDF4; border-left-color: #22C55E; }
    .tiptap-editor div[data-callout][data-type="warning"] { background: #EAF3FF; border-left-color: #0052CC; }
    .tiptap-editor div[data-callout][data-type="error"]   { background: #FFF1F2; border-left-color: #EF4444; }
  `
}

export default function PageEditor({ page, effectiveRole, onSave, onStarToggle, isStarred }) {
  const [title, setTitle] = useState(page.title)
  const [saving, setSaving] = useState(false)
  const [rightPanel, setRightPanel] = useState(null)
  const isReadOnly = effectiveRole === 'view'

  const { prefs, setPrefs, resetPrefs } = useEditorPrefs()
  const editorCss = useMemo(() => buildEditorCss(prefs, ACCENT), [prefs])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing, or type / for commands…' }),
      CharacterCount,
      Callout,
      SlashCommands,
    ],
    content: page.content && Object.keys(page.content).length > 0 ? page.content : '',
    editable: !isReadOnly,
    onUpdate: () => {},
  })

  const doSave = useCallback(async () => {
    if (!editor || isReadOnly) return
    setSaving(true)
    try {
      const updated = await docsApi.updatePage(page.id, {
        title,
        content: editor.getJSON(),
      })
      onSave(updated)
    } catch (err) {
      console.error('Page save failed:', err)
    } finally { setSaving(false) }
  }, [editor, page.id, title, isReadOnly, onSave])

  useEffect(() => { setTitle(page.title) }, [page.id])

  function handleTitleChange(e) {
    setTitle(e.target.value)
  }

  function handleTitleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); editor?.commands.focus('start') }
  }

  const canPublish = !isReadOnly && effectiveRole !== 'view'
  const isPublished = page.status === 'published'

  async function toggleStatus() {
    const newStatus = isPublished ? 'draft' : 'published'
    const updated = await docsApi.updatePageStatus(page.id, newStatus)
    onSave(updated)
  }

  const wordCount = editor?.storage.characterCount?.words() ?? 0
  const charCount = editor?.storage.characterCount?.characters() ?? 0

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Editor area ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 32px', borderBottom: '1px solid #F4F5F7',
          background: '#fff', flexShrink: 0, flexWrap: 'wrap',
        }}>
          {!isReadOnly && editor && <EditorToolbar editor={editor} />}
          <div style={{ flex: 1 }} />

          <span style={{ fontSize: '0.6875rem', color: saving ? '#97A0AF' : '#36B37E' }}>
            {saving ? 'Saving…' : ''}
          </span>

          {!isReadOnly && (
            <button
              onClick={doSave}
              disabled={saving}
              style={{
                fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: 5,
                border: 'none', cursor: saving ? 'default' : 'pointer',
                background: saving ? '#F4F5F7' : ACCENT,
                color: saving ? '#97A0AF' : '#fff',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}

          <button
            onClick={() => onStarToggle(page.id)}
            title={isStarred ? 'Remove from starred' : 'Star page'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isStarred ? '#0052CC' : '#97A0AF', fontSize: '1rem', padding: '2px 4px' }}
          >
            {isStarred ? '★' : '☆'}
          </button>

          {canPublish && (
            <button
              onClick={toggleStatus}
              style={{
                fontSize: '0.6875rem', fontWeight: 600, padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                background: isPublished ? '#E3FCEF' : '#F4F5F7',
                color: isPublished ? '#006644' : '#5E6C84',
              }}
            >
              {isPublished ? '● Published' : '○ Draft'}
            </button>
          )}

          {[
            { id: 'comments', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', title: 'Comments' },
            { id: 'versions', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', title: 'History' },
            { id: 'restrictions', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title: 'Permissions' },
          ].map(({ id, icon, title: tip }) => (
            <button
              key={id}
              onClick={() => setRightPanel(rightPanel === id ? null : id)}
              title={tip}
              style={{
                width: 28, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer',
                background: rightPanel === id ? '#DEEBFF' : 'none',
                color: rightPanel === id ? ACCENT : '#97A0AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={icon}/>
              </svg>
            </button>
          ))}

          {/* Display settings */}
          <button
            onClick={() => setRightPanel(rightPanel === 'display' ? null : 'display')}
            title="Display settings"
            style={{
              width: 28, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer',
              background: rightPanel === 'display' ? '#DEEBFF' : 'none',
              color: rightPanel === 'display' ? ACCENT : '#97A0AF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/>
              <line x1="4" y1="12" x2="20" y2="12"/><circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
              <line x1="4" y1="18" x2="20" y2="18"/><circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
            </svg>
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: `${prefs.pagePadTop}px ${prefs.pagePadRight}px ${prefs.pagePadBottom}px ${prefs.pagePadLeft}px` }}>
            {isReadOnly ? (
              <h1 style={{ margin: `0 0 ${prefs.titleMarginBottom}px`, fontSize: `${prefs.titleSize}rem`, fontWeight: 800, color: '#172B4D', lineHeight: 1.2 }}>{title}</h1>
            ) : (
              <textarea
                value={title}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                placeholder="Untitled"
                rows={1}
                style={{
                  width: '100%', margin: `0 0 ${prefs.titleMarginBottom}px`, padding: 0, border: 'none', outline: 'none', resize: 'none',
                  fontSize: `${prefs.titleSize}rem`, fontWeight: 800, color: '#172B4D', lineHeight: 1.2,
                  fontFamily: 'inherit', background: 'transparent', overflow: 'hidden',
                }}
                onInput={e => { e.target.style.height = ''; e.target.style.height = e.target.scrollHeight + 'px' }}
              />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 19, fontSize: '0.6875rem', color: '#97A0AF' }}>
              {page.created_by_email && <span>Created by {page.created_by_email}</span>}
              {page.updated_at && <span>· Last edited {new Date(page.updated_at).toLocaleDateString()}</span>}
              {page.last_edited_by_email && page.last_edited_by_email !== page.created_by_email && (
                <span>by {page.last_edited_by_email}</span>
              )}
              {isReadOnly && (
                <span style={{ marginLeft: 'auto', color: '#97A0AF', background: '#F4F5F7', borderRadius: 4, padding: '2px 6px' }}>
                  View only
                </span>
              )}
            </div>

            {/* Inline bubble menu — appears on text selection */}
            {editor && !isReadOnly && <InlineBubbleMenu editor={editor} />}

            {/* Drag handle — appears on block hover */}
            {editor && !isReadOnly && <NodeDragHandle editor={editor} />}

            <EditorContent editor={editor} className="tiptap-editor" />

            {/* Word count footer */}
            {!isReadOnly && (
              <div style={{
                marginTop: 16, paddingTop: 8, borderTop: '1px solid #F4F5F7',
                display: 'flex', gap: 16, fontSize: '0.6875rem', color: '#B3BAC5',
              }}>
                <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                <span>{charCount} {charCount === 1 ? 'character' : 'characters'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────────────────────────── */}
      {rightPanel && (
        <aside style={{
          width: 320, flexShrink: 0, borderLeft: '1px solid #DFE1E6',
          background: '#FAFBFC', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #EBECF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#172B4D' }}>
              {rightPanel === 'comments' ? 'Comments' : rightPanel === 'versions' ? 'Version history' : rightPanel === 'restrictions' ? 'Permissions' : 'Display'}
            </span>
            <button onClick={() => setRightPanel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#97A0AF' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {rightPanel === 'comments' && <PageComments pageId={page.id} isReadOnly={isReadOnly} />}
            {rightPanel === 'versions' && <PageVersionHistory pageId={page.id} onRestore={onSave} />}
            {rightPanel === 'restrictions' && <PageRestrictions pageId={page.id} effectiveRole={effectiveRole} />}
            {rightPanel === 'display' && <EditorPrefsPanel prefs={prefs} setPrefs={setPrefs} onReset={resetPrefs} />}
          </div>
        </aside>
      )}

      <style>{editorCss}</style>
    </div>
  )
}

// ── Inline bubble menu (custom, no tiptap React dependency) ──────────────────
function InlineBubbleMenu({ editor }) {
  const [pos, setPos] = useState(null)

  useEffect(() => {
    if (!editor) return
    let mounted = true
    function update() {
      if (!mounted || !editor.state) return
      const { from, to, empty } = editor.state.selection
      if (empty) { setPos(null); return }
      try {
        const start = editor.view.coordsAtPos(from)
        const end = editor.view.coordsAtPos(to)
        const midX = (start.left + end.right) / 2
        // Clamp to viewport so menu never renders off-screen
        const clampedX = Math.max(160, Math.min(window.innerWidth - 160, midX))
        setPos({ x: clampedX, y: start.top })
      } catch { setPos(null) }
    }
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      mounted = false
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  if (!pos) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y - 44,
        transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 2,
        background: '#172B4D', borderRadius: 6, padding: '4px 6px',
        boxShadow: '0 4px 16px rgba(9,30,66,0.3)',
        zIndex: 9999, pointerEvents: 'auto',
      }}
      onMouseDown={e => e.preventDefault()}
    >
      <BubbleBtn onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')} label="B" title="Bold" extraStyle={{ fontWeight: 800 }} />
      <BubbleBtn onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')} label="I" title="Italic" extraStyle={{ fontStyle: 'italic' }} />
      <BubbleBtn onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')} label="S̶" title="Strikethrough" />
      <BubbleBtn onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')} label="<>" title="Inline code" extraStyle={{ fontFamily: 'monospace', fontSize: '0.7rem' }} />
      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />
      <BubbleBtn
        onClick={() => {
          const url = window.prompt('URL:')
          if (url) editor.chain().focus().setLink({ href: url }).run()
        }}
        active={editor.isActive('link')} label="🔗" title="Link"
      />
      <BubbleBtn onClick={() => editor.chain().focus().unsetAllMarks().run()}
        active={false} label="✕" title="Clear formatting" />
    </div>,
    document.body
  )
}

// ── Bubble menu button ────────────────────────────────────────────────────────
function BubbleBtn({ onClick, active, label, title, extraStyle }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'rgba(245,158,11,0.25)' : 'transparent',
        color: active ? '#0052CC' : '#fff',
        border: 'none', cursor: 'pointer',
        minWidth: 26, height: 26, borderRadius: 4,
        fontSize: '0.75rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 5px',
        ...extraStyle,
      }}
    >
      {label}
    </button>
  )
}

// ── Toolbar ───────────────────────────────────────────────────────────────────
function EditorToolbar({ editor }) {
  const btn = (action, icon, title, active = false) => (
    <ToolbarButton key={title} onClick={action} title={title} active={active} icon={icon} />
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {/* Style picker */}
      <StylePicker editor={editor} />
      <Divider />

      {btn(() => editor.chain().focus().toggleBold().run(), 'B', 'Bold', editor.isActive('bold'))}
      {btn(() => editor.chain().focus().toggleItalic().run(), 'I', 'Italic', editor.isActive('italic'))}
      {btn(() => editor.chain().focus().toggleStrike().run(), 'S̶', 'Strikethrough', editor.isActive('strike'))}
      {btn(() => editor.chain().focus().toggleCode().run(), '<>', 'Inline code', editor.isActive('code'))}
      <Divider />

      {btn(() => editor.chain().focus().toggleBulletList().run(), '•—', 'Bullet list', editor.isActive('bulletList'))}
      {btn(() => editor.chain().focus().toggleOrderedList().run(), '1.', 'Numbered list', editor.isActive('orderedList'))}
      {btn(() => editor.chain().focus().toggleTaskList().run(), '☑', 'Task list', editor.isActive('taskList'))}
      <Divider />

      {btn(() => editor.chain().focus().toggleBlockquote().run(), '❝', 'Blockquote', editor.isActive('blockquote'))}
      {btn(() => editor.chain().focus().toggleCodeBlock().run(), '{ }', 'Code block', editor.isActive('codeBlock'))}
      {btn(() => editor.chain().focus().setHorizontalRule().run(), '—', 'Divider')}
      <Divider />

      {/* Callout buttons */}
      {btn(() => editor.chain().focus().toggleCallout('info').run(), 'ℹ️', 'Info callout', editor.isActive('callout', { type: 'info' }))}
      {btn(() => editor.chain().focus().toggleCallout('tip').run(), '💡', 'Tip callout', editor.isActive('callout', { type: 'tip' }))}
      {btn(() => editor.chain().focus().toggleCallout('warning').run(), '⚠️', 'Warning callout', editor.isActive('callout', { type: 'warning' }))}
      {btn(() => editor.chain().focus().toggleCallout('error').run(), '🚨', 'Error callout', editor.isActive('callout', { type: 'error' }))}
      <Divider />

      {btn(() => editor.chain().focus().undo().run(), '↩', 'Undo')}
      {btn(() => editor.chain().focus().redo().run(), '↪', 'Redo')}
    </div>
  )
}

// ── Style picker dropdown ─────────────────────────────────────────────────────
function StylePicker({ editor }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const current = editor.isActive('heading', { level: 1 }) ? 'Heading 1'
    : editor.isActive('heading', { level: 2 }) ? 'Heading 2'
    : editor.isActive('heading', { level: 3 }) ? 'Heading 3'
    : 'Normal text'

  const options = [
    { label: 'Normal text', action: () => editor.chain().focus().setParagraph().run() },
    { label: 'Heading 1',   action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2',   action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3',   action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          height: 26, padding: '0 8px', borderRadius: 4,
          border: '1px solid #DFE1E6', cursor: 'pointer',
          background: open ? '#F4F5F7' : '#fff',
          fontSize: '0.75rem', fontWeight: 500, color: '#172B4D',
          whiteSpace: 'nowrap',
        }}
      >
        {current}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="#5E6C84" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: '#fff', border: '1px solid #DFE1E6', borderRadius: 6,
          boxShadow: '0 4px 16px rgba(9,30,66,0.12)', zIndex: 999,
          minWidth: 140, overflow: 'hidden',
        }}>
          {options.map(opt => (
            <button
              key={opt.label}
              onMouseDown={e => { e.preventDefault(); opt.action(); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 12px', border: 'none', cursor: 'pointer',
                background: current === opt.label ? '#DEEBFF' : 'transparent',
                color: current === opt.label ? ACCENT : '#172B4D',
                fontSize: opt.label === 'Normal text' ? '0.8125rem'
                  : opt.label === 'Heading 1' ? '1rem'
                  : opt.label === 'Heading 2' ? '0.9rem' : '0.8rem',
                fontWeight: opt.label === 'Normal text' ? 400 : 700,
              }}
              onMouseEnter={e => { if (current !== opt.label) e.currentTarget.style.background = '#F4F5F7' }}
              onMouseLeave={e => { if (current !== opt.label) e.currentTarget.style.background = 'transparent' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ToolbarButton({ onClick, icon, title, active }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        minWidth: 28, height: 26, padding: '0 5px', borderRadius: 4,
        border: 'none', cursor: 'pointer',
        background: active ? '#DEEBFF' : 'transparent',
        color: active ? ACCENT : '#5E6C84',
        fontSize: '0.75rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F4F5F7' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {icon}
    </button>
  )
}

function Divider() {
  return <span style={{ width: 1, height: 16, background: '#DFE1E6', margin: '0 3px', flexShrink: 0 }} />
}

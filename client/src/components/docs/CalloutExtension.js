import { Node, mergeAttributes } from '@tiptap/core'

// Callout block: colored panel with icon + content
// Usage: editor.chain().focus().setCallout('info').run()
// Types: info (blue), tip (green), warning (yellow), error (red)

const CALLOUT_STYLES = {
  info:    { bg: '#EFF8FF', border: '#3B82F6', icon: 'ℹ️' },
  tip:     { bg: '#F0FDF4', border: '#22C55E', icon: '💡' },
  warning: { bg: '#EAF3FF', border: '#0052CC', icon: '⚠️' },
  error:   { bg: '#FFF1F2', border: '#EF4444', icon: '🚨' },
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: el => el.getAttribute('data-type') || 'info',
        renderHTML: attrs => ({ 'data-type': attrs.type }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const style = CALLOUT_STYLES[node.attrs.type] || CALLOUT_STYLES.info
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-callout': '',
        style: `border-radius:0 6px 6px 0;`,
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setCallout: (type = 'info') => ({ commands }) =>
        commands.wrapIn(this.name, { type }),
      toggleCallout: (type = 'info') => ({ commands }) =>
        commands.toggleWrap(this.name, { type }),
    }
  },
})

export { CALLOUT_STYLES }

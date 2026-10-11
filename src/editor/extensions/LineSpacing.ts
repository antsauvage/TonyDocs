import { Extension } from '@tiptap/core'
import { safeLineHeight } from '../../lib/sanitize'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineSpacing: {
      setLineSpacing: (value: string) => ReturnType
      unsetLineSpacing: () => ReturnType
    }
  }
}

/** Paragraph-level line spacing (interligne), stored as a block attribute like in Docs/Word. */
export const LineSpacing = Extension.create({
  name: 'lineSpacing',

  addOptions() {
    return { types: ['paragraph', 'heading'] }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el) => safeLineHeight(el.style.lineHeight),
            renderHTML: (attrs) => {
              const value = safeLineHeight(attrs.lineHeight)
              return value ? { style: `line-height: ${value}` } : {}
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineSpacing:
        (value) =>
        ({ commands }) =>
          this.options.types.map((t: string) => commands.updateAttributes(t, { lineHeight: safeLineHeight(value) })).some(Boolean),
      unsetLineSpacing:
        () =>
        ({ commands }) =>
          this.options.types.map((t: string) => commands.resetAttributes(t, 'lineHeight')).some(Boolean),
    }
  },
})

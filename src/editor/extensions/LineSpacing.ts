import { Extension } from '@tiptap/core'

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
            parseHTML: (el) => el.style.lineHeight || null,
            renderHTML: (attrs) => (attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {}),
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
          this.options.types.map((t: string) => commands.updateAttributes(t, { lineHeight: value })).some(Boolean),
      unsetLineSpacing:
        () =>
        ({ commands }) =>
          this.options.types.map((t: string) => commands.resetAttributes(t, 'lineHeight')).some(Boolean),
    }
  },
})

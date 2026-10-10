import { Extension, type Editor } from '@tiptap/core'
import type { Transaction } from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType
      outdent: () => ReturnType
    }
  }
}

const MAX_INDENT = 8
const STEP_PX = 48 // 0.5 inch, like Google Docs

function shiftIndent(tr: Transaction, types: string[], delta: number) {
  const { from, to } = tr.selection
  let changed = false
  tr.doc.nodesBetween(from, to, (node, pos) => {
    if (!types.includes(node.type.name)) return true
    const current = (node.attrs.indent as number) || 0
    const next = Math.min(MAX_INDENT, Math.max(0, current + delta))
    if (next !== current) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next })
      changed = true
    }
    return false
  })
  return changed
}

const inList = (editor: Editor) => editor.isActive('listItem') || editor.isActive('taskItem')

/** Block indentation (retrait), plus Tab / Shift+Tab handling that also nests list items. */
export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return { types: ['paragraph', 'heading'] }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => Number(el.getAttribute('data-indent')) || 0,
            renderHTML: (attrs) =>
              attrs.indent
                ? { 'data-indent': attrs.indent, style: `margin-left: ${attrs.indent * STEP_PX}px` }
                : {},
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ editor, tr, dispatch, commands }) => {
          if (inList(editor)) {
            return commands.sinkListItem(editor.isActive('taskItem') ? 'taskItem' : 'listItem')
          }
          const changed = shiftIndent(tr, this.options.types, 1)
          if (changed && dispatch) dispatch(tr)
          return changed
        },
      outdent:
        () =>
        ({ editor, tr, dispatch, commands }) => {
          if (inList(editor)) {
            return commands.liftListItem(editor.isActive('taskItem') ? 'taskItem' : 'listItem')
          }
          const changed = shiftIndent(tr, this.options.types, -1)
          if (changed && dispatch) dispatch(tr)
          return changed
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        if (editor.isActive('table') || editor.isActive('codeBlock')) return false
        editor.commands.indent()
        return true // never let Tab leave the editor
      },
      'Shift-Tab': ({ editor }) => {
        if (editor.isActive('table') || editor.isActive('codeBlock')) return false
        editor.commands.outdent()
        return true
      },
      Backspace: ({ editor }) => {
        // Backspace at the very start of an indented paragraph removes one indent level first.
        const { selection } = editor.state
        if (!selection.empty || selection.$from.parentOffset !== 0 || inList(editor)) return false
        const node = selection.$from.parent
        if (!node.attrs.indent) return false
        return editor.commands.outdent()
      },
    }
  },
})

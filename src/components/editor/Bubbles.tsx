import { useEditorState, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { isTextSelection } from '@tiptap/core'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link2,
  Code,
  Heading1,
  Heading2,
  Highlighter,
  ExternalLink,
  Pencil,
  Unlink,
  BetweenHorizontalStart,
  BetweenHorizontalEnd,
  BetweenVerticalStart,
  BetweenVerticalEnd,
  Rows3,
  Columns3,
  Trash2,
  PanelTop,
  TableCellsMerge,
  TableCellsSplit,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Tooltip } from '../ui/Tooltip'
import { modKey } from '../../lib/format'

function B({ label, shortcut, active, onClick, children, danger }: { label: string; shortcut?: string; active?: boolean; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <Tooltip label={label} shortcut={shortcut}>
      <button
        className={`tb-btn size-8 ${danger ? 'hover:!text-danger' : ''}`}
        data-active={active ? 'true' : undefined}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
      >
        {children}
      </button>
    </Tooltip>
  )
}

const Sep = () => <div className="mx-0.5 h-5 w-px bg-line" />

/** Floating formatting bar that appears over a text selection. */
export function TextBubble({ editor, onLink }: { editor: Editor; onLink: () => void }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      link: e.isActive('link'),
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      highlight: e.isActive('highlight'),
    }),
  })
  const chain = () => editor.chain().focus()
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="textBubble"
      options={{ placement: 'top', offset: 8 }}
      shouldShow={({ editor: e, state, from, to }) => {
        if (!e.isEditable || from === to) return false
        if (!isTextSelection(state.selection)) return false
        if (e.isActive('codeBlock') || e.isActive('image')) return false
        return state.doc.textBetween(from, to).trim().length > 0
      }}
      className="no-print"
    >
      <div className="popover-surface flex items-center gap-0.5 p-1">
        <B label="Titre 1" active={s.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="size-4" />
        </B>
        <B label="Titre 2" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-4" />
        </B>
        <Sep />
        <B label="Gras" shortcut={`${modKey}+B`} active={s.bold} onClick={() => chain().toggleBold().run()}>
          <Bold className="size-4" />
        </B>
        <B label="Italique" shortcut={`${modKey}+I`} active={s.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic className="size-4" />
        </B>
        <B label="Souligné" shortcut={`${modKey}+U`} active={s.underline} onClick={() => chain().toggleUnderline().run()}>
          <Underline className="size-4" />
        </B>
        <B label="Barré" active={s.strike} onClick={() => chain().toggleStrike().run()}>
          <Strikethrough className="size-4" />
        </B>
        <B label="Surligner" active={s.highlight} onClick={() => chain().toggleHighlight({ color: '#fff2cc' }).run()}>
          <Highlighter className="size-4" />
        </B>
        <B label="Code" active={s.code} onClick={() => chain().toggleCode().run()}>
          <Code className="size-4" />
        </B>
        <Sep />
        <B label="Lien" shortcut={`${modKey}+K`} active={s.link} onClick={onLink}>
          <Link2 className="size-4" />
        </B>
      </div>
    </BubbleMenu>
  )
}

/** Docs-like link preview card shown when the caret sits inside a link. */
export function LinkBubble({ editor, onEdit }: { editor: Editor; onEdit: () => void }) {
  const href = useEditorState({ editor, selector: ({ editor: e }) => (e.getAttributes('link').href as string | undefined) ?? '' })
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="linkBubble"
      options={{ placement: 'bottom-start', offset: 6 }}
      shouldShow={({ editor: e, state }) => state.selection.empty && e.isActive('link')}
      className="no-print"
    >
      <div className="popover-surface flex max-w-sm items-center gap-1 py-1 pr-1 pl-3">
        <ExternalLink className="size-4 shrink-0 text-muted" />
        <a href={href} target="_blank" rel="noopener noreferrer" className="mr-2 truncate text-sm text-accent hover:underline">
          {href}
        </a>
        <B label="Modifier le lien" onClick={onEdit}>
          <Pencil className="size-4" />
        </B>
        <B label="Supprimer le lien" onClick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}>
          <Unlink className="size-4" />
        </B>
      </div>
    </BubbleMenu>
  )
}

/** Contextual table toolbar shown while the caret is inside a table. */
export function TableBubble({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({ canMerge: e.can().mergeCells(), canSplit: e.can().splitCell() }),
  })
  const chain = () => editor.chain().focus()
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubble"
      options={{ placement: 'top', offset: 10 }}
      getReferencedVirtualElement={() => {
        const { $from } = editor.state.selection
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'table') {
            const dom = editor.view.nodeDOM($from.before(d)) as HTMLElement | null
            const el = dom?.closest('.tableWrapper') ?? dom
            if (el) return { getBoundingClientRect: () => el.getBoundingClientRect(), getClientRects: () => el.getClientRects() }
          }
        }
        return null
      }}
      shouldShow={({ editor: e }) => e.isEditable && e.isActive('table')}
      className="no-print"
    >
      <div className="popover-surface flex items-center gap-0.5 p-1">
        <B label="Insérer une ligne au-dessus" onClick={() => chain().addRowBefore().run()}>
          <BetweenHorizontalStart className="size-4" />
        </B>
        <B label="Insérer une ligne en dessous" onClick={() => chain().addRowAfter().run()}>
          <BetweenHorizontalEnd className="size-4" />
        </B>
        <B label="Insérer une colonne à gauche" onClick={() => chain().addColumnBefore().run()}>
          <BetweenVerticalStart className="size-4" />
        </B>
        <B label="Insérer une colonne à droite" onClick={() => chain().addColumnAfter().run()}>
          <BetweenVerticalEnd className="size-4" />
        </B>
        <Sep />
        {s.canMerge && (
          <B label="Fusionner les cellules" onClick={() => chain().mergeCells().run()}>
            <TableCellsMerge className="size-4" />
          </B>
        )}
        {s.canSplit && (
          <B label="Scinder la cellule" onClick={() => chain().splitCell().run()}>
            <TableCellsSplit className="size-4" />
          </B>
        )}
        <B label="Ligne d'en-tête" onClick={() => chain().toggleHeaderRow().run()}>
          <PanelTop className="size-4" />
        </B>
        <Sep />
        <B label="Supprimer la ligne" danger onClick={() => chain().deleteRow().run()}>
          <Rows3 className="size-4" />
        </B>
        <B label="Supprimer la colonne" danger onClick={() => chain().deleteColumn().run()}>
          <Columns3 className="size-4" />
        </B>
        <B label="Supprimer le tableau" danger onClick={() => chain().deleteTable().run()}>
          <Trash2 className="size-4" />
        </B>
      </div>
    </BubbleMenu>
  )
}

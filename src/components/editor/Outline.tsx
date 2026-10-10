import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { ArrowLeft, ListTree } from 'lucide-react'

interface HeadingItem {
  level: number
  text: string
  pos: number
}

function collect(editor: Editor): HeadingItem[] {
  const items: HeadingItem[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      items.push({ level: node.attrs.level, text: node.textContent, pos })
      return false
    }
    return node.type.name === 'doc'
  })
  return items
}

/** Live document outline built from headings; highlights the section under the cursor. */
export function Outline({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [items, setItems] = useState<HeadingItem[]>(() => collect(editor))
  const [cursor, setCursor] = useState(editor.state.selection.from)

  useEffect(() => {
    let raf = 0
    const onUpdate = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setItems(collect(editor)))
    }
    const onSelection = () => setCursor(editor.state.selection.from)
    editor.on('update', onUpdate)
    editor.on('selectionUpdate', onSelection)
    return () => {
      cancelAnimationFrame(raf)
      editor.off('update', onUpdate)
      editor.off('selectionUpdate', onSelection)
    }
  }, [editor])

  const activePos = [...items].reverse().find((h) => h.pos <= cursor)?.pos
  const minLevel = Math.min(...items.map((h) => h.level), 4)

  const jump = (h: HeadingItem) => {
    editor.chain().focus().setTextSelection(h.pos + 1).run()
    const dom = editor.view.nodeDOM(h.pos) as HTMLElement | null
    dom?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <aside className="no-print hidden w-64 shrink-0 animate-fade overflow-y-auto py-5 pr-3 pl-5 lg:block">
      <div className="mb-4 flex items-center gap-1">
        <button onClick={onClose} className="tb-btn size-8 rounded-full" aria-label="Masquer le plan">
          <ArrowLeft className="size-[18px]" />
        </button>
      </div>
      <div className="mb-2 flex items-center gap-2 px-1 text-[13px] font-medium text-ink-soft">
        <ListTree className="size-4" />
        Plan
      </div>
      {items.length === 0 ? (
        <p className="px-1 text-[13px] leading-relaxed text-muted">Les titres ajoutés au document apparaîtront ici.</p>
      ) : (
        <ul className="flex flex-col gap-px">
          {items.map((h) => {
            const active = h.pos === activePos
            return (
              <li key={h.pos}>
                <button
                  onClick={() => jump(h)}
                  className={`relative w-full truncate rounded-md py-1.5 pr-2 text-left text-[13px] transition-colors hover:bg-hover ${
                    active ? 'font-medium text-accent' : h.level === minLevel ? 'text-ink' : 'text-ink-soft'
                  }`}
                  style={{ paddingLeft: 10 + (h.level - minLevel) * 14 }}
                >
                  {active && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-accent" />}
                  {h.text || <span className="italic text-muted">Titre vide</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { ChevronDown, ChevronUp, X, CaseSensitive, ChevronRight } from 'lucide-react'
import { getSearchState } from '../../editor/extensions/SearchReplace'
import { Tooltip } from '../ui/Tooltip'

export function FindReplace({
  editor,
  withReplace,
  onClose,
}: {
  editor: Editor
  withReplace: boolean
  onClose: () => void
}) {
  const [term, setTerm] = useState(() => {
    const { from, to, empty } = editor.state.selection
    const selected = empty ? '' : editor.state.doc.textBetween(from, to, ' ')
    return selected.length < 80 ? selected : ''
  })
  const [replacement, setReplacement] = useState('')
  const [showReplace, setShowReplace] = useState(withReplace)
  const inputRef = useRef<HTMLInputElement>(null)

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const st = getSearchState(e.state)
      return { count: st?.results.length ?? 0, index: st?.index ?? 0, caseSensitive: st?.caseSensitive ?? false }
    },
  })

  useEffect(() => setShowReplace((v) => v || withReplace), [withReplace])

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [withReplace])

  useEffect(() => {
    editor.commands.setSearch({ term })
  }, [term, editor])

  // Clear highlights when the panel closes.
  useEffect(() => () => void editor.commands.setSearch({ term: '' }), [editor])

  // Keep the current match visible.
  useEffect(() => {
    if (!s.count) return
    requestAnimationFrame(() => {
      editor.view.dom.querySelector('.search-match-current')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }, [s.index, s.count, editor])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
      editor.commands.focus()
    }
    if (e.key === 'Enter' && e.currentTarget === inputRef.current) {
      e.preventDefault()
      if (e.shiftKey) editor.commands.previousMatch()
      else editor.commands.nextMatch()
    }
  }

  return (
    <div className="no-print absolute top-3 right-6 z-40 w-[380px] animate-pop popover-surface p-3" onKeyDown={onKey}>
      <div className="flex items-center gap-1.5">
        <button
          className="tb-btn size-7"
          onClick={() => setShowReplace(!showReplace)}
          aria-label={showReplace ? 'Masquer le remplacement' : 'Afficher le remplacement'}
        >
          <ChevronRight className={`size-4 transition-transform ${showReplace ? 'rotate-90' : ''}`} />
        </button>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Rechercher dans le document"
            className="field !h-8 !pr-16 !text-[13px]"
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted tabular-nums">
            {term ? (s.count ? `${s.index + 1} sur ${s.count}` : '0 résultat') : ''}
          </span>
        </div>
        <Tooltip label="Respecter la casse">
          <button
            className="tb-btn size-7"
            data-active={s.caseSensitive ? 'true' : undefined}
            onClick={() => editor.commands.setSearch({ caseSensitive: !s.caseSensitive })}
          >
            <CaseSensitive className="size-4" />
          </button>
        </Tooltip>
        <Tooltip label="Précédent" shortcut="Maj+Entrée">
          <button className="tb-btn size-7" disabled={!s.count} onClick={() => editor.commands.previousMatch()}>
            <ChevronUp className="size-4" />
          </button>
        </Tooltip>
        <Tooltip label="Suivant" shortcut="Entrée">
          <button className="tb-btn size-7" disabled={!s.count} onClick={() => editor.commands.nextMatch()}>
            <ChevronDown className="size-4" />
          </button>
        </Tooltip>
        <button className="tb-btn size-7" onClick={onClose} aria-label="Fermer">
          <X className="size-4" />
        </button>
      </div>
      {showReplace && (
        <div className="mt-2 flex animate-fade items-center gap-1.5 pl-[34px]">
          <input
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Remplacer par"
            className="field !h-8 flex-1 !text-[13px]"
          />
          <button
            className="h-8 rounded-lg px-2.5 text-[13px] font-medium text-accent hover:bg-accent-soft disabled:opacity-40"
            disabled={!s.count}
            onClick={() => editor.commands.replaceMatch(replacement)}
          >
            Remplacer
          </button>
          <button
            className="h-8 rounded-lg px-2.5 text-[13px] font-medium text-accent hover:bg-accent-soft disabled:opacity-40"
            disabled={!s.count}
            onClick={() => editor.commands.replaceAllMatches(replacement)}
          >
            Tout
          </button>
        </div>
      )}
    </div>
  )
}

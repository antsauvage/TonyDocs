import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { SuggestionProps } from '@tiptap/suggestion'
import type { SlashItem } from './slashItems'

export interface SlashMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

export const SlashMenu = forwardRef<SlashMenuHandle, SuggestionProps<SlashItem, SlashItem>>(
  function SlashMenu({ items, command }, ref) {
    const [selected, setSelected] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)

    useEffect(() => setSelected(0), [items])

    useEffect(() => {
      listRef.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' })
    }, [selected])

    useImperativeHandle(ref, () => ({
      onKeyDown: (event) => {
        if (!items.length) return false
        if (event.key === 'ArrowDown') {
          setSelected((s) => (s + 1) % items.length)
          return true
        }
        if (event.key === 'ArrowUp') {
          setSelected((s) => (s - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          command(items[selected])
          return true
        }
        return false
      },
    }))

    return (
      <div ref={listRef} className="popover-surface w-72 max-h-80 overflow-y-auto p-1.5 animate-pop">
        <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted">Insérer</div>
        {items.length === 0 && <div className="px-2.5 py-2 text-sm text-muted">Aucun résultat</div>}
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <button
              key={item.title}
              data-index={i}
              onMouseEnter={() => setSelected(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                command(item)
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left ${
                i === selected ? 'bg-hover' : ''
              }`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface">
                <Icon className="size-4 text-ink-soft" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{item.title}</span>
                <span className="block truncate text-xs text-muted">{item.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    )
  },
)

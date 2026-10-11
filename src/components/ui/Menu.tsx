import { useRef, useState, type ReactNode } from 'react'
import { Check, ChevronRight, type LucideIcon } from 'lucide-react'
import { Floating } from './Popover'
import { isTouchDevice } from '../../lib/device'

export type MenuEntry =
  | {
      type?: 'item'
      label: string
      icon?: LucideIcon
      shortcut?: string
      checked?: boolean
      disabled?: boolean
      danger?: boolean
      onSelect: () => void
    }
  | { type: 'separator' }
  | { type: 'submenu'; label: string; icon?: LucideIcon; items: MenuEntry[] }
  | { type: 'custom'; render: (close: () => void) => ReactNode }

function SubmenuItem({ entry, close }: { entry: Extract<MenuEntry, { type: 'submenu' }>; close: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const timer = useRef(0)
  const Icon = entry.icon
  // Touch: submenus open on tap only (emulated hover events would close them under the finger).
  const enter = () => {
    if (isTouchDevice) return
    clearTimeout(timer.current)
    setOpen(true)
  }
  const leave = () => {
    if (isTouchDevice) return
    timer.current = window.setTimeout(() => setOpen(false), 180)
  }
  return (
    <div onMouseEnter={enter} onMouseLeave={leave}>
      <button ref={ref} className="menu-item" data-highlighted={open} onClick={() => setOpen((o) => (isTouchDevice ? !o : true))}>
        <span className="flex size-4 items-center justify-center">{Icon && <Icon className="size-4 text-ink-soft" />}</span>
        <span className="flex-1">{entry.label}</span>
        <ChevronRight className="size-4 text-muted" />
      </button>
      <Floating anchor={ref} open={open} onClose={() => setOpen(false)} placement={innerWidth < 640 ? 'bottom-start' : 'right-start'} gap={2}>
        <div onMouseEnter={enter} onMouseLeave={leave}>
          <MenuList items={entry.items} close={close} />
        </div>
      </Floating>
    </div>
  )
}

/** Renders a list of menu entries (items, separators, nested submenus). */
export function MenuList({ items, close, minWidth = 260 }: { items: MenuEntry[]; close: () => void; minWidth?: number }) {
  return (
    <div className="popover-surface py-1.5 px-1.5" style={{ minWidth }} role="menu">
      {items.map((entry, i) => {
        if (entry.type === 'separator') return <div key={i} className="my-1.5 h-px bg-line" />
        if (entry.type === 'submenu') return <SubmenuItem key={i} entry={entry} close={close} />
        if (entry.type === 'custom') return <div key={i}>{entry.render(close)}</div>
        const Icon = entry.icon
        return (
          <button
            key={i}
            role="menuitem"
            disabled={entry.disabled}
            className={`menu-item ${entry.danger ? '!text-danger' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              close()
              entry.onSelect()
            }}
          >
            <span className="flex size-4 items-center justify-center">
              {entry.checked ? (
                <Check className="size-4 text-accent" />
              ) : (
                Icon && <Icon className={`size-4 ${entry.danger ? '' : 'text-ink-soft'}`} />
              )}
            </span>
            <span className="flex-1">{entry.label}</span>
            {entry.shortcut && <span className="pl-6 text-xs text-muted">{entry.shortcut}</span>}
          </button>
        )
      })}
    </div>
  )
}

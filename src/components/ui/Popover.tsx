import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

export type Placement = 'bottom-start' | 'bottom-end' | 'bottom' | 'right-start' | 'top'

function computePosition(anchor: DOMRect, el: HTMLElement, placement: Placement, gap: number) {
  const w = el.offsetWidth
  const h = el.offsetHeight
  let top: number
  let left: number
  if (placement === 'right-start') {
    top = anchor.top - 6
    left = anchor.right + gap
    if (left + w > innerWidth - 8) left = anchor.left - w - gap
  } else if (placement === 'top') {
    top = anchor.top - h - gap
    left = anchor.left + anchor.width / 2 - w / 2
  } else {
    top = anchor.bottom + gap
    left =
      placement === 'bottom-end'
        ? anchor.right - w
        : placement === 'bottom'
          ? anchor.left + anchor.width / 2 - w / 2
          : anchor.left
    if (top + h > innerHeight - 8 && anchor.top - h - gap > 8) top = anchor.top - h - gap
  }
  top = Math.max(8, Math.min(top, innerHeight - h - 8))
  left = Math.max(8, Math.min(left, innerWidth - w - 8))
  return { top, left }
}

const NO_IGNORE: RefObject<HTMLElement | null>[] = []

interface FloatingProps {
  anchor: RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
  placement?: Placement
  gap?: number
  children: ReactNode
  className?: string
  /** Elements that count as "inside" (e.g. the trigger), so clicking them doesn't close. */
  ignore?: RefObject<HTMLElement | null>[]
}

/** Viewport-aware floating layer rendered in a portal; closes on outside click and Escape. */
export function Floating({ anchor, open, onClose, placement = 'bottom-start', gap = 4, children, className, ignore = NO_IGNORE }: FloatingProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const update = useCallback(() => {
    if (!anchor.current || !ref.current) return
    const next = computePosition(anchor.current.getBoundingClientRect(), ref.current, placement, gap)
    setPos((prev) => (prev && prev.top === next.top && prev.left === next.left ? prev : next))
  }, [anchor, placement, gap])

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    update()
  }, [open, update])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node
      if (ref.current?.contains(t)) return
      if (anchor.current?.contains(t)) return
      if (ignore.some((r) => r.current?.contains(t))) return
      // Clicks inside nested floating layers (submenus) are handled by those layers.
      if ((t as Element).closest?.('[data-floating]')) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('pointerdown', onPointer, true)
    document.addEventListener('keydown', onKey, true)
    addEventListener('resize', update)
    addEventListener('scroll', update, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      document.removeEventListener('keydown', onKey, true)
      removeEventListener('resize', update)
      removeEventListener('scroll', update, true)
    }
  }, [open, onClose, anchor, ignore, update])

  if (!open) return null
  return createPortal(
    <div
      ref={ref}
      data-floating=""
      // React events bubble through portals to the trigger's ancestors (e.g. a clickable card): stop them here.
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className={`fixed z-50 ${pos ? 'animate-pop' : 'invisible'} ${className ?? ''}`}
      style={{ top: pos?.top ?? 0, left: pos?.left ?? 0 }}
    >
      {children}
    </div>,
    document.body,
  )
}

/** Trigger + floating panel, the building block for every dropdown in the app. */
export function Popover({
  trigger,
  children,
  placement,
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void; ref: RefObject<HTMLButtonElement | null> }) => ReactNode
  children: (close: () => void) => ReactNode
  placement?: Placement
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  return (
    <>
      {trigger({ open, toggle: () => setOpen((o) => !o), ref })}
      <Floating anchor={ref} open={open} onClose={close} placement={placement} className={className}>
        {children(close)}
      </Floating>
    </>
  )
}

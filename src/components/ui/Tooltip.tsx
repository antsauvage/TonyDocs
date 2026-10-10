import { cloneElement, useRef, useState, type ReactElement, type Ref } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  label: string
  shortcut?: string
  children: ReactElement<{ ref?: Ref<HTMLElement>; onMouseEnter?: () => void; onMouseLeave?: () => void; onMouseDown?: (e: React.MouseEvent) => void; 'aria-label'?: string }>
}

/** Small dark tooltip shown below the element after a short delay, with an optional shortcut hint. */
export function Tooltip({ label, shortcut, children }: TooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const timer = useRef<number>(0)
  const el = useRef<HTMLElement>(null)

  const show = () => {
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const r = el.current?.getBoundingClientRect()
      if (r) setPos({ x: r.left + r.width / 2, y: r.bottom + 6 })
    }, 450)
  }
  const hide = () => {
    clearTimeout(timer.current)
    setPos(null)
  }

  return (
    <>
      {cloneElement(children, {
        ref: el,
        onMouseEnter: show,
        onMouseLeave: hide,
        onMouseDown: (e: React.MouseEvent) => {
          hide()
          children.props.onMouseDown?.(e)
        },
        'aria-label': children.props['aria-label'] ?? label,
      })}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[70] -translate-x-1/2 animate-fade whitespace-nowrap rounded-md bg-[#2d2f31] px-2 py-1 text-xs font-medium text-white shadow-lg dark:bg-[#e8eaed] dark:text-[#1f1f1f]"
            style={{ left: pos.x, top: pos.y }}
          >
            {label}
            {shortcut && <span className="ml-1.5 opacity-60">{shortcut}</span>}
          </div>,
          document.body,
        )}
    </>
  )
}

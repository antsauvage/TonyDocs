import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 440,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative flex max-h-[85vh] w-full animate-pop flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <button onClick={onClose} className="tb-btn size-8 rounded-full" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

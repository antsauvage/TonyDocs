import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ToastItem {
  id: number
  message: string
  action?: { label: string; run: () => void }
}

const ToastContext = createContext<(message: string, action?: ToastItem['action']) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), [])

  const toast = useCallback(
    (message: string, action?: ToastItem['action']) => {
      const id = nextId.current++
      setItems((all) => [...all.slice(-2), { id, message, action }])
      setTimeout(() => dismiss(id), action ? 6000 : 3500)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className="no-print pointer-events-none fixed bottom-6 left-6 z-[90] flex flex-col gap-2">
          {items.map((t) => (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex min-w-72 animate-rise items-center justify-between gap-6 rounded-lg bg-[#2d2f31] px-4 py-3 text-sm text-white shadow-xl dark:bg-[#e8eaed] dark:text-[#1f1f1f]"
            >
              <span>{t.message}</span>
              {t.action && (
                <button
                  className="font-medium text-[#a8c7fa] hover:underline dark:text-[#0b57d0]"
                  onClick={() => {
                    t.action!.run()
                    dismiss(t.id)
                  }}
                >
                  {t.action.label}
                </button>
              )}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

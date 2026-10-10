import { useState } from 'react'

/** Hover grid to pick table dimensions, like Docs / Word. */
export function TableGridPicker({ onPick, max = 10 }: { onPick: (rows: number, cols: number) => void; max?: number }) {
  const [hover, setHover] = useState<[number, number]>([0, 0])
  return (
    <div onMouseLeave={() => setHover([0, 0])}>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${max}, 18px)` }}>
        {Array.from({ length: max * max }, (_, i) => {
          const r = Math.floor(i / max) + 1
          const c = (i % max) + 1
          const on = r <= hover[0] && c <= hover[1]
          return (
            <button
              key={i}
              aria-label={`${r} × ${c}`}
              onMouseEnter={() => setHover([r, c])}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(r, c)}
              className={`size-[18px] rounded-[3px] border transition-colors ${
                on ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface'
              }`}
            />
          )
        })}
      </div>
      <div className="mt-2 text-center text-[13px] text-ink-soft">
        {hover[0] ? `${hover[1]} × ${hover[0]}` : 'Insérer un tableau'}
      </div>
    </div>
  )
}

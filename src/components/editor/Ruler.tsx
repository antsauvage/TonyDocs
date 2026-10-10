const PAGE = 794
const MARGIN = 96
const PX_PER_CM = PAGE / 21

/** Centimetre ruler matching the A4 page; graduations count from the text margin, like Docs. */
export function Ruler() {
  const ticks = []
  const start = Math.ceil((-MARGIN / PX_PER_CM) * 4)
  const end = Math.floor(((PAGE - MARGIN) / PX_PER_CM) * 4)
  for (let q = start; q <= end; q++) {
    const x = MARGIN + (q / 4) * PX_PER_CM
    const major = q % 4 === 0
    const half = q % 2 === 0
    ticks.push(
      <g key={q}>
        {!major && <line x1={x} x2={x} y1={half ? 15 : 18} y2={21} stroke="currentColor" strokeWidth={1} opacity={0.4} />}
        {major && q !== 0 && (
          <text x={x} y={16} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.8}>
            {Math.abs(q / 4)}
          </text>
        )}
      </g>,
    )
  }
  return (
    <svg width={PAGE} height={24} className="block text-muted" aria-hidden="true">
      <rect x={0} y={4} width={PAGE} height={18} rx={2} className="fill-[var(--page)]" />
      <rect x={0} y={4} width={MARGIN} height={18} className="fill-[var(--surface-2)]" />
      <rect x={PAGE - MARGIN} y={4} width={MARGIN} height={18} className="fill-[var(--surface-2)]" />
      {ticks}
      <path d={`M${MARGIN - 5} 2 h10 l-5 6 z`} className="fill-[var(--accent)]" />
      <path d={`M${PAGE - MARGIN - 5} 2 h10 l-5 6 z`} className="fill-[var(--accent)]" />
    </svg>
  )
}

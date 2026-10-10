export function Logo({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tonydocs-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f8cff" />
          <stop offset="1" stopColor="#1a5fd6" />
        </linearGradient>
      </defs>
      <path d="M10 4h20l10 10v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="url(#tonydocs-logo)" />
      <path d="M30 4v8a2 2 0 0 0 2 2h8z" fill="#a9c7ff" />
      <rect x="14" y="22" width="20" height="3" rx="1.5" fill="#fff" />
      <rect x="14" y="28" width="20" height="3" rx="1.5" fill="#fff" />
      <rect x="14" y="34" width="13" height="3" rx="1.5" fill="#fff" />
    </svg>
  )
}

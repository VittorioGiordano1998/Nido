/**
 * Brand: the Nido mark (a sheltering arch around an egg — the home and what it
 * holds, same drawing as the favicon, minus the tile) and the serif wordmark.
 * Keep it in step with app/public/favicon.svg.
 */

export function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="9.5 9 45 46.5" fill="none" aria-hidden="true" className={className}>
      <path
        d="M14 52V31a18 18 0 0 1 36 0v21"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="40" rx="7" ry="8.8" fill="currentColor" />
    </svg>
  )
}

export function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span className="flex items-center gap-2 text-ink">
      <BrandMark className={`text-accent-500 ${size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'}`} />
      <span
        className={`font-display font-semibold tracking-tight ${
          size === 'lg' ? 'text-3xl' : 'text-xl'
        }`}
      >
        Nido
      </span>
    </span>
  )
}

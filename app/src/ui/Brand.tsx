/**
 * Brand: the Nido mark (a ring around a dot — the nest and what it holds, same
 * drawing as the favicon) and the serif wordmark.
 */

export function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="16" cy="16" r="3.5" fill="currentColor" />
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

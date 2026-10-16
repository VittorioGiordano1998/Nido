/**
 * Skeleton placeholders (TASK-UI-…-002): shape-matched stand-ins shown while a
 * surface loads, so the page does not jump when the content arrives. Pure CSS
 * (Tailwind pulse), disabled by the OS reduced-motion setting.
 */

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-xl bg-surface-muted motion-reduce:animate-none ${className}`}
    />
  )
}

/** A card-shaped list (Home sections, Noi pages): `rows` bars of ~68 px. */
export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="rounded-3xl bg-surface/60 p-4 ring-1 ring-line/50">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}

/** A grid of square tiles (lists index, memories, loyalty). */
export function GridSkeleton({ cells = 4 }: { cells?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2" aria-hidden="true">
      {Array.from({ length: cells }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-2xl" />
      ))}
    </div>
  )
}

/** Header-shaped skeleton for a sub-page title + description. */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

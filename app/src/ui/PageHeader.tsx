import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ChevronLeftIcon, ChevronRightIcon } from './icons'

/**
 * PageHeader: the title block every page opens with — optional back link,
 * serif title, one line of description and an action on the right.
 */
interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Small line above the title (a date, a section name). */
  eyebrow?: ReactNode
  /** Route of the parent page; renders the back chevron. */
  backTo?: string
  backLabel?: string
  /** Primary action (a Button or ButtonLink), aligned to the right. */
  action?: ReactNode
}

export function PageHeader({
  title,
  description,
  eyebrow,
  backTo,
  backLabel = 'Indietro',
  action,
}: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-1.5">
        {backTo && (
          <Link
            to={backTo}
            aria-label={backLabel}
            viewTransition
            className="-ml-1.5 mt-0.5 shrink-0 rounded-full p-1.5 text-ink-muted transition hover:bg-surface-muted hover:text-ink"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-widest text-accent-glyph">
              {eyebrow}
            </p>
          )}
          <h1 className="text-balance text-[1.75rem] font-semibold leading-tight text-ink lg:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-prose text-pretty text-sm text-ink-muted">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </header>
  )
}

/** SectionHeader: a serif section title with an optional "see all" link. */
export function SectionHeader({
  title,
  to,
  linkLabel,
  action,
}: {
  title: ReactNode
  to?: string
  linkLabel?: string
  /** Replaces the link (e.g. a small button). */
  action?: ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {action ??
        (to && linkLabel && (
          <Link
            to={to}
            viewTransition
            className="group inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-accent-ink"
          >
            <span className="group-hover:underline">{linkLabel}</span>
            <ChevronRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        ))}
    </div>
  )
}

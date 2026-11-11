import { Link } from 'react-router-dom'

import { daysUntil, formatShortDateIt, formatTimeIt, relativeDayLabel, toDateKey } from '../../core/dates'
import { ChevronRightIcon, GiftIcon, HourglassIcon } from '../../ui/icons'
import type { EventOccurrence } from '../calendar/recurrence'

interface NextMomentCardProps {
  occurrence: EventOccurrence
}

/** The countdown card on Home: big number of days, what and when. */
export function NextMomentCard({ occurrence }: NextMomentCardProps) {
  const start = new Date(occurrence.startAt)
  const days = Math.max(0, daysUntil(start))
  const { event } = occurrence
  const isOccasion = event.occasion !== null

  const eyebrow = isOccasion ? 'Da festeggiare' : 'Prossimo momento'
  const when = `${formatShortDateIt(occurrence.startAt)}${
    event.allDay ? '' : ` · ${formatTimeIt(occurrence.startAt)}`
  }`
  const Icon = isOccasion ? GiftIcon : HourglassIcon

  return (
    <Link
      to="/calendar"
      state={{ dateKey: toDateKey(start) }}
      viewTransition
      className={`group relative flex items-center gap-4 overflow-hidden rounded-3xl p-4 shadow-card ring-1 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift ${
        isOccasion ? 'bg-honey-soft ring-honey-ink/15' : 'bg-surface ring-line/60'
      }`}
    >
      <span
        className={`flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-2xl ${
          isOccasion ? 'bg-surface/70 text-honey-ink' : 'bg-accent-50 text-accent-ink'
        }`}
      >
        {days <= 1 ? (
          <>
            <Icon className="h-6 w-6" />
            <span className="mt-0.5 text-xs font-bold capitalize">{relativeDayLabel(days)}</span>
          </>
        ) : (
          <>
            <span className="font-display text-3xl font-semibold leading-none tabular-nums">
              {days}
            </span>
            <span className="mt-0.5 text-[11px] font-semibold">giorni</span>
          </>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[11px] font-semibold uppercase tracking-widest ${
            isOccasion ? 'text-honey-ink' : 'text-accent-glyph'
          }`}
        >
          {eyebrow}
        </span>
        <span className="block truncate font-display text-xl font-semibold text-ink">
          {event.title}
        </span>
        <span className="block truncate text-xs text-ink-muted first-letter:uppercase">
          {when}
          {event.location ? ` · ${event.location}` : ''}
        </span>
      </span>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-ink-faint transition group-hover:translate-x-0.5" />
    </Link>
  )
}

import { daysUntil } from '../../core/dates'
import type { EventOccurrence } from '../calendar/recurrence'

/** How far ahead a birthday or anniversary takes precedence over the next plain event. */
export const OCCASION_HORIZON_DAYS = 30

/**
 * Picks the moment worth counting down to: a tagged occasion in the next 30
 * days if there is one, otherwise simply the next event. `upcoming` must be
 * sorted by start, soonest first.
 */
export function pickNextMoment(
  upcoming: EventOccurrence[],
  today = new Date(),
): EventOccurrence | null {
  const occasion = upcoming.find(
    (occurrence) =>
      occurrence.event.occasion !== null &&
      daysUntil(new Date(occurrence.startAt), today) <= OCCASION_HORIZON_DAYS,
  )
  return occasion ?? upcoming[0] ?? null
}

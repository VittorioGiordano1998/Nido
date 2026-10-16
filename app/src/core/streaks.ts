import { fromDateKey, toDateKey } from './dates'

/**
 * Consecutive-day streak helper (TASK-QA-…-001): pure, shared by the daily
 * question and the mood check-in. Counts back from today over a set of
 * `YYYY-MM-DD` keys; when today is missing the streak may still be alive from
 * yesterday, so the walk starts there.
 */
export function streakFromDates(dates: Iterable<string>, todayKey: string): number {
  const set = new Set(dates)
  let cursor = set.has(todayKey) ? todayKey : previousDay(todayKey)
  let count = 0
  while (set.has(cursor)) {
    count += 1
    cursor = previousDay(cursor)
  }
  return count
}

export function previousDay(dateKey: string): string {
  const date = fromDateKey(dateKey)
  date.setDate(date.getDate() - 1)
  return toDateKey(date)
}

import { toDateKey } from '../../core/dates.ts'
import type { CalendarEvent } from './useEvents'

/**
 * Recurrence (a deliberate RRULE subset, no dependency): FREQ, INTERVAL,
 * UNTIL and COUNT for DAILY/WEEKLY/MONTHLY/YEARLY. Two documented
 * deviations from RFC 5545, chosen for a couple's calendar:
 * - a monthly recurrence on the 31st clamps to the last day of shorter
 *   months instead of skipping them (rent and anniversaries stay monthly);
 * - UNTIL is stored as a date (`YYYYMMDD`), inclusive.
 */
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface Recurrence {
  frequency: RecurrenceFrequency
  /** Every N days/weeks/months/years. */
  interval: number
  /** Local date key, inclusive; null = never ends. */
  until: string | null
  /** Total occurrences counted from the first; null = no count. */
  count: number | null
}

export interface EventOccurrence {
  /** Unique per event+instant: stable React key and notification tag. */
  key: string
  event: CalendarEvent
  startAt: string
  endAt: string | null
  recurring: boolean
}

const FREQUENCIES: readonly RecurrenceFrequency[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']
const MAX_ITERATIONS = 1000

function normalizeUntil(value: string | null): string | null {
  if (!value) return null
  const digits = value.replace(/[^0-9]/g, '')
  if (digits.length < 8) return null
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

/** Lenient parse: unknown keys are ignored, an unknown FREQ means no recurrence. */
export function parseRecurrence(value: string | null): Recurrence | null {
  if (!value) return null
  const parts = new Map<string, string>()
  for (const chunk of value.split(';')) {
    const separator = chunk.indexOf('=')
    if (separator <= 0) continue
    const key = chunk.slice(0, separator).trim().toUpperCase()
    const raw = chunk.slice(separator + 1).trim()
    if (key && raw) parts.set(key, raw)
  }
  const frequency = parts.get('FREQ')?.toUpperCase()
  if (!frequency || !FREQUENCIES.includes(frequency as RecurrenceFrequency)) return null

  const intervalRaw = Number(parts.get('INTERVAL') ?? '1')
  const countRaw = Number(parts.get('COUNT') ?? '')
  return {
    frequency: frequency as RecurrenceFrequency,
    interval: Number.isFinite(intervalRaw) && intervalRaw >= 1 ? Math.trunc(intervalRaw) : 1,
    until: normalizeUntil(parts.get('UNTIL') ?? null),
    count: Number.isFinite(countRaw) && countRaw >= 1 ? Math.trunc(countRaw) : null,
  }
}

export function serializeRecurrence(recurrence: Recurrence | null): string | null {
  if (!recurrence) return null
  const pieces = [
    `FREQ=${recurrence.frequency}`,
    `INTERVAL=${Math.max(1, Math.trunc(recurrence.interval))}`,
  ]
  if (recurrence.count) pieces.push(`COUNT=${Math.max(1, Math.trunc(recurrence.count))}`)
  else if (recurrence.until) pieces.push(`UNTIL=${recurrence.until.replace(/-/g, '')}T235959Z`)
  return pieces.join(';')
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** The n-th occurrence start, computed from the base date (wall clock preserved). */
function occurrenceStart(base: Date, recurrence: Recurrence, index: number): Date {
  const year = base.getFullYear()
  const month = base.getMonth()
  const day = base.getDate()
  const hours = base.getHours()
  const minutes = base.getMinutes()

  if (recurrence.frequency === 'DAILY') {
    return new Date(year, month, day + index * recurrence.interval, hours, minutes)
  }
  if (recurrence.frequency === 'WEEKLY') {
    return new Date(year, month, day + index * recurrence.interval * 7, hours, minutes)
  }
  if (recurrence.frequency === 'MONTHLY') {
    const target = month + index * recurrence.interval
    const targetYear = year + Math.floor(target / 12)
    const targetMonth = ((target % 12) + 12) % 12
    return new Date(
      targetYear,
      targetMonth,
      Math.min(day, daysInMonth(targetYear, targetMonth)),
      hours,
      minutes,
    )
  }
  const targetYear = year + index * recurrence.interval
  return new Date(targetYear, month, Math.min(day, daysInMonth(targetYear, month)), hours, minutes)
}

/** Fast-forward for old series: first index whose occurrence can land in the window. */
function initialIndex(base: Date, recurrence: Recurrence, windowStart: Date): number {
  const diffMs = windowStart.getTime() - base.getTime()
  if (diffMs <= 0) return 0
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (recurrence.frequency === 'DAILY') {
    return Math.max(0, Math.floor(diffDays / recurrence.interval) - 1)
  }
  if (recurrence.frequency === 'WEEKLY') {
    return Math.max(0, Math.floor(diffDays / (recurrence.interval * 7)) - 1)
  }
  const diffMonths =
    (windowStart.getFullYear() - base.getFullYear()) * 12 +
    (windowStart.getMonth() - base.getMonth())
  if (recurrence.frequency === 'MONTHLY') {
    return Math.max(0, Math.floor(diffMonths / recurrence.interval) - 1)
  }
  return Math.max(0, Math.floor(diffMonths / (recurrence.interval * 12)) - 1)
}

function makeOccurrence(
  event: CalendarEvent,
  baseStart: Date,
  start: Date,
  recurring: boolean,
): EventOccurrence {
  const durationMs = event.endAt ? new Date(event.endAt).getTime() - baseStart.getTime() : null
  return {
    key: `${event.id}:${start.toISOString()}`,
    event,
    startAt: start.toISOString(),
    endAt: durationMs === null ? null : new Date(start.getTime() + durationMs).toISOString(),
    recurring,
  }
}

/**
 * Expands the events whose start falls inside [windowStart, windowEnd];
 * recurring rows stay a single `events` row and fan out here.
 */
export function expandOccurrences(
  events: CalendarEvent[],
  windowStart: Date,
  windowEnd: Date,
  perEventLimit = 100,
): EventOccurrence[] {
  const result: EventOccurrence[] = []
  for (const event of events) {
    const base = new Date(event.startAt)
    const recurrence = parseRecurrence(event.rrule)
    if (!recurrence) {
      if (base >= windowStart && base <= windowEnd) {
        result.push(makeOccurrence(event, base, base, false))
      }
      continue
    }

    let emitted = 0
    const startIndex = initialIndex(base, recurrence, windowStart)
    for (
      let index = startIndex;
      index < startIndex + MAX_ITERATIONS && emitted < perEventLimit;
      index += 1
    ) {
      if (recurrence.count !== null && index >= recurrence.count) break
      const start = occurrenceStart(base, recurrence, index)
      if (recurrence.until && toDateKey(start) > recurrence.until) break
      if (start > windowEnd) break
      if (start >= windowStart) {
        result.push(makeOccurrence(event, base, start, true))
        emitted += 1
      }
    }
  }
  return result.sort((a, b) => a.startAt.localeCompare(b.startAt))
}

/** When an occurrence stops being "imminent" (mirrors the old eventEnd). */
export function occurrenceEndMs(occurrence: EventOccurrence): number {
  if (occurrence.endAt) return new Date(occurrence.endAt).getTime()
  const start = new Date(occurrence.startAt).getTime()
  return occurrence.event.allDay ? start + 24 * 60 * 60 * 1000 : start + 60 * 60 * 1000
}

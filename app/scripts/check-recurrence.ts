/**
 * Small runnable check for the recurrence math (no test framework: Node runs
 * TypeScript directly). Run with `npm run check:recurrence` inside app/.
 */
import assert from 'node:assert/strict'

import { toDateKey } from '../src/core/dates.ts'
import { expandOccurrences, parseRecurrence, serializeRecurrence } from '../src/features/calendar/recurrence.ts'
import type { CalendarEvent } from '../src/features/calendar/useEvents.ts'

function event(
  start: Date,
  rrule: string | null,
  options: { endAt?: Date | null; allDay?: boolean } = {},
): CalendarEvent {
  return {
    id: 'e1',
    coupleId: 'c1',
    title: 'Test',
    description: null,
    location: null,
    startAt: start.toISOString(),
    endAt: options.endAt ? options.endAt.toISOString() : null,
    allDay: options.allDay ?? false,
    visibility: 'couple',
    createdBy: 'u1',
    updatedAt: start.toISOString(),
    rrule,
  }
}

function keys(events: CalendarEvent[], from: Date, to: Date): string[] {
  return expandOccurrences(events, from, to).map((occurrence) =>
    toDateKey(new Date(occurrence.startAt)),
  )
}

const WEEKLY = 'FREQ=WEEKLY;INTERVAL=1'
const base = new Date(2026, 9, 15, 9, 0) // Thu 15 Oct 2026, 09:00 local
const october = new Date(2026, 9, 1)
const november = new Date(2026, 10, 1)

// Weekly, no bound: every Thursday in the window.
assert.deepEqual(keys([event(base, WEEKLY)], october, november), [
  '2026-10-15',
  '2026-10-22',
  '2026-10-29',
])

// UNTIL is inclusive and stops the series.
assert.deepEqual(
  keys([event(base, 'FREQ=WEEKLY;INTERVAL=1;UNTIL=20261022T235959Z')], october, november),
  ['2026-10-15', '2026-10-22'],
)

// COUNT counts from the first occurrence.
assert.deepEqual(keys([event(base, 'FREQ=WEEKLY;INTERVAL=1;COUNT=3')], october, november), [
  '2026-10-15',
  '2026-10-22',
  '2026-10-29',
])

// Every two weeks.
assert.deepEqual(keys([event(base, 'FREQ=WEEKLY;INTERVAL=2')], october, november), [
  '2026-10-15',
  '2026-10-29',
])
assert.deepEqual(
  keys([event(base, 'FREQ=WEEKLY;INTERVAL=2')], october, new Date(2026, 11, 1)),
  ['2026-10-15', '2026-10-29', '2026-11-12', '2026-11-26'],
)

// Monthly on the 31st clamps to shorter months (documented deviation).
assert.deepEqual(
  keys(
    [event(new Date(2026, 0, 31, 9, 0), 'FREQ=MONTHLY;INTERVAL=1')],
    new Date(2026, 0, 1),
    new Date(2026, 4, 1),
  ),
  ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'],
)

// Yearly from 29 February clamps to the 28th on non-leap years.
assert.deepEqual(
  keys(
    [event(new Date(2024, 1, 29, 9, 0), 'FREQ=YEARLY;INTERVAL=1')],
    new Date(2024, 0, 1),
    new Date(2027, 0, 1),
  ),
  ['2024-02-29', '2025-02-28', '2026-02-28'],
)

// Daily across the DST change keeps the wall-clock hour.
const dstStart = new Date(2026, 9, 23, 9, 0)
const dstWindowEnd = new Date(2026, 9, 28)
const dstOccurrences = expandOccurrences(
  [event(dstStart, 'FREQ=DAILY;INTERVAL=1')],
  dstStart,
  dstWindowEnd,
)
assert.equal(dstOccurrences.length, 5)
for (const occurrence of dstOccurrences) {
  assert.equal(new Date(occurrence.startAt).getHours(), 9)
}

// Duration is preserved on occurrences; a series far in the past fast-forwards.
const timed = event(base, WEEKLY, { endAt: new Date(2026, 9, 15, 10, 0) })
const occurrence = expandOccurrences([timed], new Date(2027, 5, 1), new Date(2027, 6, 1))[0]
assert.ok(occurrence)
assert.equal(new Date(occurrence.endAt ?? '').getHours() - new Date(occurrence.startAt).getHours(), 1)

// Round trip through the stored text form.
const parsed = parseRecurrence('FREQ=MONTHLY;INTERVAL=2;UNTIL=20270301T235959Z')
assert.deepEqual(parsed, {
  frequency: 'MONTHLY',
  interval: 2,
  until: '2027-03-01',
  count: null,
})
assert.equal(serializeRecurrence(parsed), 'FREQ=MONTHLY;INTERVAL=2;UNTIL=20270301T235959Z')
assert.equal(parseRecurrence('FREQ=NOPE'), null)

console.log('check-recurrence: all assertions passed')

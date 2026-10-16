import { describe, expect, it } from 'vitest'

import {
  expandOccurrences,
  parseRecurrence,
  serializeRecurrence,
} from '../src/features/calendar/recurrence'
import { makeEvent } from './fixtures'

const local = (year: number, month: number, day: number, hours = 10, minutes = 0) =>
  new Date(year, month - 1, day, hours, minutes).toISOString()

describe('parseRecurrence / serializeRecurrence', () => {
  it('parses a full rule and the COUNT form', () => {
    expect(parseRecurrence('FREQ=WEEKLY;INTERVAL=2;UNTIL=20261231T235959Z')).toEqual({
      frequency: 'WEEKLY',
      interval: 2,
      until: '2026-12-31',
      count: null,
    })
    expect(parseRecurrence('FREQ=DAILY;COUNT=3')).toEqual({
      frequency: 'DAILY',
      interval: 1,
      until: null,
      count: 3,
    })
  })

  it('ignores unknown keys and rejects unknown or missing FREQ', () => {
    expect(parseRecurrence('FREQ=NOPE')).toBeNull()
    expect(parseRecurrence(null)).toBeNull()
    expect(parseRecurrence('X=1')).toBeNull()
  })

  it('serializes back to the stored text', () => {
    expect(serializeRecurrence({ frequency: 'DAILY', interval: 1, until: null, count: 3 })).toBe(
      'FREQ=DAILY;INTERVAL=1;COUNT=3',
    )
    expect(
      serializeRecurrence({ frequency: 'WEEKLY', interval: 1, until: '2026-12-31', count: null }),
    ).toBe('FREQ=WEEKLY;INTERVAL=1;UNTIL=20261231T235959Z')
  })
})

describe('expandOccurrences', () => {
  const windowStart = new Date(2026, 0, 1)
  const windowEnd = new Date(2027, 0, 1)

  it('keeps a single event as one occurrence inside the window', () => {
    const event = makeEvent({ startAt: local(2026, 5, 10) })
    expect(expandOccurrences([event], windowStart, windowEnd)).toHaveLength(1)
    const outside = makeEvent({ startAt: local(2025, 5, 10) })
    expect(expandOccurrences([outside], windowStart, windowEnd)).toHaveLength(0)
  })

  it('stops a daily series at COUNT', () => {
    const event = makeEvent({
      startAt: local(2026, 5, 10, 10),
      rrule: 'FREQ=DAILY;INTERVAL=1;COUNT=3',
    })
    const occurrences = expandOccurrences([event], windowStart, windowEnd)
    expect(occurrences.map((o) => o.startAt)).toEqual([
      local(2026, 5, 10, 10),
      local(2026, 5, 11, 10),
      local(2026, 5, 12, 10),
    ])
  })

  it('honours UNTIL on a two-weekly series', () => {
    const event = makeEvent({
      startAt: local(2026, 10, 7, 10),
      rrule: 'FREQ=WEEKLY;INTERVAL=2;UNTIL=20261231T235959Z',
    })
    const occurrences = expandOccurrences([event], windowStart, windowEnd)
    // 7 oct, 21 oct, 4 nov, 18 nov, 2 dec, 16 dec, 30 dec
    expect(occurrences).toHaveLength(7)
    expect(occurrences[0]?.startAt).toBe(local(2026, 10, 7, 10))
    expect(occurrences[6]?.startAt).toBe(local(2026, 12, 30, 10))
  })

  it('clamps a monthly series on the 31st to shorter months', () => {
    const event = makeEvent({
      startAt: local(2026, 1, 31, 10),
      rrule: 'FREQ=MONTHLY;INTERVAL=1;UNTIL=20260430T235959Z',
    })
    const occurrences = expandOccurrences([event], windowStart, windowEnd)
    expect(occurrences.map((o) => o.startAt)).toEqual([
      local(2026, 1, 31, 10),
      local(2026, 2, 28, 10),
      local(2026, 3, 31, 10),
      local(2026, 4, 30, 10),
    ])
  })

  it('only emits occurrences inside the window and orders them by start', () => {
    const daily = makeEvent({
      id: 'daily',
      startAt: local(2026, 5, 1, 18),
      rrule: 'FREQ=DAILY;INTERVAL=1',
    })
    const single = makeEvent({ id: 'single', startAt: local(2026, 5, 2, 9) })
    const occurrences = expandOccurrences(
      [daily, single],
      new Date(2026, 4, 2, 0, 0),
      new Date(2026, 4, 2, 23, 59),
    )
    expect(occurrences.map((o) => o.startAt)).toEqual([
      local(2026, 5, 2, 9),
      local(2026, 5, 2, 18),
    ])
    expect(occurrences.every((o) => o.startAt >= new Date(2026, 4, 2).toISOString())).toBe(true)
  })
})

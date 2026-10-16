import { describe, expect, it } from 'vitest'

import { reminderAtMs } from '../src/features/calendar/reminders'
import { makeOccurrence } from './fixtures'

describe('reminderAtMs', () => {
  it('reminds 15 minutes before a timed event by default', () => {
    const occurrence = makeOccurrence({ startAt: new Date(2026, 9, 16, 15, 30).toISOString() })
    expect(reminderAtMs(occurrence)).toBe(new Date(2026, 9, 16, 15, 15).getTime())
  })

  it('honours a custom lead on a timed event', () => {
    const occurrence = makeOccurrence({
      startAt: new Date(2026, 9, 16, 15, 30).toISOString(),
      remindMinutes: 120,
    })
    expect(reminderAtMs(occurrence)).toBe(new Date(2026, 9, 16, 13, 30).getTime())
  })

  it('returns null when the event mutes the reminder', () => {
    const occurrence = makeOccurrence({ remindMinutes: 0 })
    expect(reminderAtMs(occurrence)).toBeNull()
  })

  it('reminds all-day events at 9:00 by default', () => {
    const occurrence = makeOccurrence({
      allDay: true,
      startAt: new Date(2026, 9, 16, 0, 0).toISOString(),
    })
    expect(reminderAtMs(occurrence)).toBe(new Date(2026, 9, 16, 9, 0).getTime())
  })

  it('counts the lead back from 9:00 for all-day events', () => {
    const occurrence = makeOccurrence({
      allDay: true,
      startAt: new Date(2026, 9, 16, 0, 0).toISOString(),
      remindMinutes: 1440,
    })
    expect(reminderAtMs(occurrence)).toBe(new Date(2026, 9, 15, 9, 0).getTime())
  })
})

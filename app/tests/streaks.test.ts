import { describe, expect, it } from 'vitest'

import { streakFromDates } from '../src/core/streaks'

describe('streakFromDates', () => {
  it('counts consecutive days ending today', () => {
    expect(streakFromDates(['2026-10-16', '2026-10-15', '2026-10-14'], '2026-10-16')).toBe(3)
  })

  it('keeps a streak alive when today has not happened yet', () => {
    expect(streakFromDates(['2026-10-15', '2026-10-14'], '2026-10-16')).toBe(2)
  })

  it('stops at the first gap', () => {
    expect(streakFromDates(['2026-10-16', '2026-10-14'], '2026-10-16')).toBe(1)
  })

  it('crosses a month boundary', () => {
    expect(streakFromDates(['2026-10-01', '2026-09-30', '2026-09-29'], '2026-10-01')).toBe(3)
  })

  it('is zero without check-ins and independent of order/duplicates', () => {
    expect(streakFromDates([], '2026-10-16')).toBe(0)
    expect(streakFromDates(['2026-10-14', '2026-10-16', '2026-10-16', '2026-10-15'], '2026-10-16')).toBe(3)
  })
})

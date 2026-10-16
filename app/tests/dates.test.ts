import { describe, expect, it } from 'vitest'

import {
  daysSince,
  fromDateKey,
  monthCells,
  parseIsoDate,
  startOfMonth,
  toDateKey,
} from '../src/core/dates'

describe('date keys', () => {
  it('round-trips a local date through its key', () => {
    const date = new Date(2026, 9, 16, 15, 30)
    expect(toDateKey(date)).toBe('2026-10-16')
    const back = fromDateKey('2026-10-16')
    expect([back.getFullYear(), back.getMonth(), back.getDate()]).toEqual([2026, 9, 16])
  })

  it('daysSince counts calendar days and never goes negative', () => {
    expect(daysSince('2026-10-14', new Date(2026, 9, 16))).toBe(2)
    expect(daysSince('2026-10-16', new Date(2026, 9, 16))).toBe(0)
    expect(daysSince('2026-12-01', new Date(2026, 9, 16))).toBe(0)
  })

  it('parseIsoDate rejects garbage and accepts a date', () => {
    expect(parseIsoDate('not-a-date')).toBeNull()
    expect(parseIsoDate('2026-10-16')).not.toBeNull()
  })
})

describe('monthCells', () => {
  it('returns 42 consecutive cells starting on the Monday of the 1st week', () => {
    // 1 October 2026 is a Thursday: the first cell is Monday 28 September.
    const cells = monthCells(startOfMonth(new Date(2026, 9, 1)))
    expect(cells).toHaveLength(42)
    expect(cells[0]?.key).toBe('2026-09-28')
    expect(cells[0]?.inMonth).toBe(false)
    expect(cells[3]?.key).toBe('2026-10-01')
    expect(cells[3]?.inMonth).toBe(true)
    for (let index = 1; index < cells.length; index += 1) {
      // Normalised in UTC: across the DST change a local day is 25 hours long.
      const dayNumber = (key: string) => {
        const date = fromDateKey(key)
        return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      }
      expect(dayNumber(cells[index]!.key) - dayNumber(cells[index - 1]!.key)).toBe(86_400_000)
    }
  })
})

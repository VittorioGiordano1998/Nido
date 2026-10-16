import { describe, expect, it } from 'vitest'

import { hashString, pickQuestionIndex } from '../src/features/question/pick'

describe('daily question pick', () => {
  it('is deterministic for the same couple and day', () => {
    const first = pickQuestionIndex('couple-1', '2026-10-16', 100)
    const second = pickQuestionIndex('couple-1', '2026-10-16', 100)
    expect(first).toBe(second)
  })

  it('always lands inside the bank', () => {
    for (let day = 1; day <= 30; day += 1) {
      const index = pickQuestionIndex('couple-1', `2026-10-${String(day).padStart(2, '0')}`, 100)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(100)
    }
    expect(pickQuestionIndex('couple-1', '2026-10-16', 1)).toBe(0)
  })

  it('hashString is stable and varies with the input', () => {
    expect(hashString('nido')).toBe(hashString('nido'))
    expect(hashString('nido')).not.toBe(hashString('nido!'))
    expect(hashString('')).toBe(2166136261)
  })
})

import { describe, expect, it } from 'vitest'

import { daysUntil, greetingFor, relativeDayLabel, weekDays } from '../src/core/dates'
import { pickNextMoment } from '../src/features/home/nextMoment'
import { memoriesOnThisDay, yearsAgoLabel } from '../src/features/memories/onThisDay'
import type { Memory } from '../src/features/memories/useMemories'
import { makeOccurrence } from './fixtures'

function memory(id: string, takenOn: string): Memory {
  return {
    id,
    coupleId: 'couple',
    photoPath: `${id}.jpg`,
    caption: id,
    takenOn,
    bucketItemId: null,
    createdBy: 'user',
    createdAt: `${takenOn}T10:00:00.000Z`,
  }
}

describe('countdown helpers', () => {
  const today = new Date(2026, 10, 11, 18, 45)

  it('daysUntil counts calendar days, whatever the time of day', () => {
    expect(daysUntil(new Date(2026, 10, 11, 0, 5), today)).toBe(0)
    expect(daysUntil(new Date(2026, 10, 12, 23, 59), today)).toBe(1)
    expect(daysUntil(new Date(2026, 11, 25, 9, 0), today)).toBe(44)
    expect(daysUntil(new Date(2026, 10, 9, 9, 0), today)).toBe(-2)
  })

  it('daysUntil is not thrown off by a daylight-saving change', () => {
    // Last Sunday of March 2027: the local day is 23 hours long.
    expect(daysUntil(new Date(2027, 2, 29), new Date(2027, 2, 27))).toBe(2)
  })

  it('relativeDayLabel reads naturally', () => {
    expect(relativeDayLabel(0)).toBe('oggi')
    expect(relativeDayLabel(1)).toBe('domani')
    expect(relativeDayLabel(12)).toBe('tra 12 giorni')
  })

  it('weekDays runs Monday to Sunday around the given day', () => {
    const days = weekDays(today)
    expect(days.map((day) => day.key)).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ])
    // A Sunday belongs to the week that started the Monday before.
    expect(weekDays(new Date(2026, 10, 15))[0]?.key).toBe('2026-11-09')
  })

  it('greetingFor follows the local hour', () => {
    expect(greetingFor(new Date(2026, 10, 11, 8))).toBe('Buongiorno')
    expect(greetingFor(new Date(2026, 10, 11, 15))).toBe('Buon pomeriggio')
    expect(greetingFor(new Date(2026, 10, 11, 22))).toBe('Buonasera')
    expect(greetingFor(new Date(2026, 10, 11, 2))).toBe('Buonasera')
  })
})

describe('on this day', () => {
  const today = new Date(2026, 10, 11)
  const memories = [
    memory('same-day-2024', '2024-11-11'),
    memory('same-day-2025', '2025-11-11'),
    memory('today', '2026-11-11'),
    memory('other-day', '2025-11-12'),
  ]

  it('keeps earlier years on the same calendar day, most recent first', () => {
    expect(memoriesOnThisDay(memories, today).map((item) => item.id)).toEqual([
      'same-day-2025',
      'same-day-2024',
    ])
  })

  it('is empty when nothing matches', () => {
    expect(memoriesOnThisDay(memories, new Date(2026, 0, 1))).toEqual([])
  })

  it('labels the distance in years', () => {
    expect(yearsAgoLabel('2025-11-11', today)).toBe('Un anno fa oggi')
    expect(yearsAgoLabel('2023-11-11', today)).toBe('3 anni fa oggi')
  })
})

describe('next moment', () => {
  const today = new Date(2026, 10, 11, 9, 0)
  const dinner = makeOccurrence({
    id: 'dinner',
    title: 'Cena',
    startAt: new Date(2026, 10, 13, 20, 0).toISOString(),
  })
  const birthday = makeOccurrence({
    id: 'birthday',
    title: 'Compleanno',
    occasion: 'birthday',
    startAt: new Date(2026, 10, 28, 0, 0).toISOString(),
  })
  const farAnniversary = makeOccurrence({
    id: 'anniversary',
    title: 'Anniversario',
    occasion: 'anniversary',
    startAt: new Date(2027, 0, 20, 0, 0).toISOString(),
  })

  it('prefers an occasion inside the horizon over a nearer plain event', () => {
    expect(pickNextMoment([dinner, birthday], today)?.event.id).toBe('birthday')
  })

  it('falls back to the next event when the occasion is too far', () => {
    expect(pickNextMoment([dinner, farAnniversary], today)?.event.id).toBe('dinner')
  })

  it('is null with nothing upcoming', () => {
    expect(pickNextMoment([], today)).toBeNull()
  })
})

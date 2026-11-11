import { describe, expect, it } from 'vitest'

import { rankFeatured, parseUsage } from '../src/features/us/hubUsage'
import {
  normalizeText,
  queryTokens,
  rankMatches,
  scoreMatch,
} from '../src/features/search/match'

describe('search normalization', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(normalizeText('  Caffè   LUNGO ')).toBe('caffe lungo')
    expect(normalizeText('Perché no?')).toBe('perche no?')
  })

  it('splits a query into words and drops blanks', () => {
    expect(queryTokens('  cena   sabato ')).toEqual(['cena', 'sabato'])
    expect(queryTokens('   ')).toEqual([])
  })
})

describe('search scoring', () => {
  it('finds accented text from an unaccented query and the other way round', () => {
    expect(scoreMatch(queryTokens('caffe'), 'Caffè al bar')).toBeGreaterThan(0)
    expect(scoreMatch(queryTokens('città'), 'Giro in citta')).toBeGreaterThan(0)
  })

  it('requires every word of the query', () => {
    expect(scoreMatch(queryTokens('cena sabato'), 'Cena', 'sabato sera')).toBeGreaterThan(0)
    expect(scoreMatch(queryTokens('cena domenica'), 'Cena', 'sabato sera')).toBe(0)
  })

  it('ranks a title prefix over a word start, the inside of a word and the secondary text', () => {
    const tokens = queryTokens('mare')
    const prefix = scoreMatch(tokens, 'Mare a luglio')
    const word = scoreMatch(tokens, 'Weekend al mare')
    const inside = scoreMatch(tokens, 'Lungomare')
    const secondary = scoreMatch(tokens, 'Vacanze', 'una settimana al mare')
    expect(prefix).toBeGreaterThan(word)
    expect(word).toBeGreaterThan(inside)
    expect(inside).toBeGreaterThan(secondary)
    expect(secondary).toBeGreaterThan(0)
  })

  it('never matches an empty query', () => {
    expect(scoreMatch([], 'Qualsiasi cosa')).toBe(0)
  })
})

describe('search ranking', () => {
  const items = [
    { title: 'Lista della spesa', note: 'pane, latte' },
    { title: 'Spesa di sabato', note: '' },
    { title: 'Film da vedere', note: 'dopo la spesa' },
    { title: 'Valigie', note: '' },
  ]
  const fields = (item: (typeof items)[number]) => ({ title: item.title, secondary: [item.note] })

  it('orders by relevance, keeps the original order on ties and honors the limit', () => {
    const ranked = rankMatches(items, queryTokens('spesa'), fields, 10)
    expect(ranked.map((item) => item.title)).toEqual([
      'Spesa di sabato',
      'Lista della spesa',
      'Film da vedere',
    ])
    expect(rankMatches(items, queryTokens('spesa'), fields, 1)).toHaveLength(1)
  })

  it('returns nothing for a blank query', () => {
    expect(rankMatches(items, queryTokens(''), fields, 10)).toEqual([])
  })
})

describe('hub usage ranking', () => {
  const catalog = ['/us/question', '/us/plan', '/us/memories', '/us/bucket', '/us/savings']
  const defaults = ['/us/question', '/us/memories', '/us/bucket']

  it('falls back to the defaults before any usage', () => {
    expect(rankFeatured({}, catalog, defaults)).toEqual(defaults)
  })

  it('puts the most opened first and fills the rest with defaults', () => {
    expect(rankFeatured({ '/us/savings': 5, '/us/plan': 2 }, catalog, defaults)).toEqual([
      '/us/savings',
      '/us/plan',
      '/us/question',
    ])
  })

  it('breaks ties by catalog order and ignores unknown routes', () => {
    expect(
      rankFeatured({ '/us/bucket': 3, '/us/plan': 3, '/us/gone': 99 }, catalog, defaults),
    ).toEqual(['/us/plan', '/us/bucket', '/us/question'])
  })

  it('parses stored counters defensively', () => {
    expect(parseUsage(null)).toEqual({})
    expect(parseUsage('not json')).toEqual({})
    expect(parseUsage('[1,2]')).toEqual({})
    expect(parseUsage('{"/us/plan":2.7,"/us/pick":-1,"/us/facts":"x"}')).toEqual({
      '/us/plan': 2,
    })
  })
})

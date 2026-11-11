/**
 * Text matching for the global search (TASK-SEARCH-…-002). Pure: no data, no
 * DOM. Case and accents are ignored, every word of the query must be found,
 * and a hit in the title outranks a hit in the secondary text.
 */

const COMBINING_MARKS = /[̀-ͯ]/g

/** Lowercase, accent-free, single-spaced: `Caffè  Lungo` → `caffe lungo`. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** The words of a query, normalized; empty when the query is blank. */
export function queryTokens(query: string): string[] {
  const normalized = normalizeText(query)
  return normalized ? normalized.split(' ') : []
}

const TITLE_PREFIX = 4
const TITLE_WORD = 3
const TITLE_INSIDE = 2
const SECONDARY = 1

function tokenScore(token: string, title: string, secondary: string): number {
  if (title.startsWith(token)) return TITLE_PREFIX
  if (title.includes(` ${token}`)) return TITLE_WORD
  if (title.includes(token)) return TITLE_INSIDE
  if (secondary.includes(token)) return SECONDARY
  return 0
}

/**
 * Relevance of an item for the query tokens: 0 when any token is missing,
 * otherwise the sum of each token's best hit (title prefix > word start >
 * inside the title > secondary text).
 */
export function scoreMatch(
  tokens: readonly string[],
  title: string,
  ...secondary: Array<string | null | undefined>
): number {
  if (tokens.length === 0) return 0
  const normalizedTitle = normalizeText(title)
  const normalizedSecondary = normalizeText(secondary.filter(Boolean).join(' '))
  let total = 0
  for (const token of tokens) {
    const score = tokenScore(token, normalizedTitle, normalizedSecondary)
    if (score === 0) return 0
    total += score
  }
  return total
}

/**
 * Filters and ranks `items` for the query: best score first, the original
 * order as tie-breaker, at most `limit` results.
 */
export function rankMatches<T>(
  items: readonly T[],
  tokens: readonly string[],
  fields: (item: T) => { title: string; secondary?: Array<string | null | undefined> },
  limit: number,
): T[] {
  if (tokens.length === 0) return []
  return items
    .map((item, index) => {
      const { title, secondary = [] } = fields(item)
      return { item, index, score: scoreMatch(tokens, title, ...secondary) }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.item)
}

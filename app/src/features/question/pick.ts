/**
 * Daily-question pick (TASK-QA-…-001): FNV-1a over couple + day, so the choice
 * is stable for the whole day and independent of how the bank is ordered.
 */

/** FNV-1a 32-bit: deterministic, stable across sessions and platforms. */
export function hashString(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Index of today's question in the bank; the caller passes a bank size > 0. */
export function pickQuestionIndex(coupleId: string, dayKey: string, bankSize: number): number {
  return hashString(`${coupleId}:${dayKey}`) % bankSize
}

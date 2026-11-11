import { toDateKey } from '../../core/dates'
import type { Memory } from './useMemories'

/**
 * "Un anno fa oggi" (TASK-MEMO-…-002): the memories taken on today's calendar
 * day in an earlier year, most recent first. Pure, shared by Ricordi and Home.
 */
export function memoriesOnThisDay(memories: Memory[], today = new Date()): Memory[] {
  const monthDay = toDateKey(today).slice(5)
  const year = today.getFullYear()
  return memories
    .filter(
      (memory) =>
        memory.takenOn.slice(5) === monthDay && Number(memory.takenOn.slice(0, 4)) < year,
    )
    .sort((a, b) => b.takenOn.localeCompare(a.takenOn))
}

/** `Un anno fa oggi` / `3 anni fa oggi` for a memory taken on `takenOn`. */
export function yearsAgoLabel(takenOn: string, today = new Date()): string {
  const years = Math.max(1, today.getFullYear() - Number(takenOn.slice(0, 4)))
  return years === 1 ? 'Un anno fa oggi' : `${years} anni fa oggi`
}

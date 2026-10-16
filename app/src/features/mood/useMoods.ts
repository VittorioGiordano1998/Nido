import { useCallback, useEffect, useMemo, useState } from 'react'

import { fromDateKey, toDateKey } from '../../core/dates'
import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Mood check-in (state layer, TASK-MOOD-…-001): one row per member per day
 * (`moods`), both partners visible, own streak. Realtime on `moods`.
 */

export interface MoodEntry {
  userId: string
  moodDate: string
  mood: number
  note: string | null
}

export interface MoodLevel {
  value: number
  emoji: string
  label: string
}

/** Five fixed levels: face plus one word. */
export const MOOD_LEVELS: readonly MoodLevel[] = [
  { value: 1, emoji: '😞', label: 'Male' },
  { value: 2, emoji: '😕', label: 'Giù' },
  { value: 3, emoji: '🙂', label: 'Così così' },
  { value: 4, emoji: '😄', label: 'Bene' },
  { value: 5, emoji: '🤩', label: 'Al top' },
]

export function moodLevel(value: number): MoodLevel {
  return MOOD_LEVELS.find((level) => level.value === value) ?? MOOD_LEVELS[2]
}

const DAYS_WINDOW = 7

interface MoodRow {
  user_id: string
  mood_date: string
  mood: number
  note: string | null
}

const MOOD_COLUMNS = 'user_id, mood_date, mood, note'

function addDays(dateKey: string, delta: number): string {
  const date = fromDateKey(dateKey)
  date.setDate(date.getDate() + delta)
  return toDateKey(date)
}

export function useMoods() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null
  const [todayKey] = useState(() => toDateKey(new Date()))

  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setEntries([])
      setLoading(false)
      return
    }
    setLoading(true)
    const since = addDays(todayKey, -(DAYS_WINDOW - 1))
    const { data, error: loadError } = await supabase
      .from('moods')
      .select(MOOD_COLUMNS)
      .eq('couple_id', coupleId)
      .gte('mood_date', since)
      .order('mood_date', { ascending: false })
    if (loadError) {
      setError(loadError.message)
    } else {
      setEntries(
        ((data ?? []) as unknown as MoodRow[]).map((row) => ({
          userId: row.user_id,
          moodDate: row.mood_date,
          mood: row.mood,
          note: row.note,
        })),
      )
      setError(null)
    }
    setLoading(false)
  }, [coupleId, todayKey])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(uniqueChannelTopic(`moods-${coupleId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moods', filter: `couple_id=eq.${coupleId}` },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId, refresh])

  /** Records or updates today's mood (one row per member per day). */
  const setMood = useCallback(
    async (mood: number, note: string | null) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { error: upsertError } = await supabase.from('moods').upsert(
        {
          couple_id: coupleId,
          user_id: userId,
          mood_date: todayKey,
          mood,
          note: note && note.trim() ? note.trim() : null,
        },
        { onConflict: 'user_id,mood_date' },
      )
      if (upsertError) throw new Error(upsertError.message)
      await refresh()
    },
    [coupleId, userId, todayKey, refresh],
  )

  const myToday = useMemo(
    () => entries.find((entry) => entry.userId === userId && entry.moodDate === todayKey) ?? null,
    [entries, userId, todayKey],
  )

  const partnerToday = useMemo(
    () => entries.find((entry) => entry.userId !== userId && entry.moodDate === todayKey) ?? null,
    [entries, userId, todayKey],
  )

  /** Seven day keys, oldest first, with each member's mood (or null). */
  const week = useMemo(() => {
    const days: Array<{ dateKey: string; mine: MoodEntry | null; theirs: MoodEntry | null }> = []
    for (let offset = DAYS_WINDOW - 1; offset >= 0; offset -= 1) {
      const dateKey = addDays(todayKey, -offset)
      days.push({
        dateKey,
        mine: entries.find((entry) => entry.userId === userId && entry.moodDate === dateKey) ?? null,
        theirs:
          entries.find((entry) => entry.userId !== userId && entry.moodDate === dateKey) ?? null,
      })
    }
    return days
  }, [entries, userId, todayKey])

  /** Consecutive days with my own check-in, ending today (or yesterday). */
  const streak = useMemo(() => {
    const mine = new Set(
      entries.filter((entry) => entry.userId === userId).map((entry) => entry.moodDate),
    )
    let cursor = mine.has(todayKey) ? todayKey : addDays(todayKey, -1)
    let count = 0
    while (mine.has(cursor)) {
      count += 1
      cursor = addDays(cursor, -1)
    }
    return count
  }, [entries, userId, todayKey])

  return { entries, loading, error, myToday, partnerToday, week, streak, setMood, refresh }
}

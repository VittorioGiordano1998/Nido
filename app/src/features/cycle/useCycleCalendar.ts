import { useCallback, useEffect, useState } from 'react'

import { formatDayMonthIt, fromDateKey, toDateKey } from '../../core/dates'
import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Couple-visible cycle periods for the shared calendar (state layer).
 * Reads `cycle_shares` only — the diary itself (`cycle_logs`) stays owner-only
 * in RLS and is never fetched here. Dates only: no flow, symptoms or notes.
 */

export interface CyclePeriod {
  id: string
  userId: string
  periodStart: string
  periodEnd: string | null
}

interface CycleShareRow {
  id: string
  user_id: string
  period_start: string
  period_end: string | null
}

const SHARE_COLUMNS = 'id, user_id, period_start, period_end'

/** Day keys covered by a period (`period_end` null = the single start day). */
export function periodDayKeys(period: CyclePeriod, maxDays = 366): string[] {
  const start = fromDateKey(period.periodStart)
  const end = period.periodEnd ? fromDateKey(period.periodEnd) : start
  const keys: string[] = []
  let cursor = start
  while (cursor.getTime() <= end.getTime() && keys.length < maxDays) {
    keys.push(toDateKey(cursor))
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)
  }
  return keys
}

/** Compact range label for the day agenda (`16 ott` / `16 ott – 20 ott`). */
export function periodLabel(period: CyclePeriod): string {
  const start = formatDayMonthIt(period.periodStart)
  if (!period.periodEnd || period.periodEnd === period.periodStart) return start
  return `${start} – ${formatDayMonthIt(period.periodEnd)}`
}

function rowToPeriod(row: CycleShareRow): CyclePeriod {
  return {
    id: row.id,
    userId: row.user_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  }
}

function asRow(value: unknown): CycleShareRow | null {
  return typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string'
    ? (value as unknown as CycleShareRow)
    : null
}

export function useCycleCalendar() {
  const { couple } = useCouple()
  const coupleId = couple?.id ?? null

  const [periods, setPeriods] = useState<CyclePeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setPeriods([])
      setLoading(false)
      return
    }
    const { data, error: loadError } = await supabase
      .from('cycle_shares')
      .select(SHARE_COLUMNS)
      .eq('couple_id', coupleId)
      .order('period_start', { ascending: false })
    if (loadError) {
      setError(loadError.message)
    } else {
      setError(null)
      setPeriods(((data ?? []) as unknown as CycleShareRow[]).map(rowToPeriod))
    }
    setLoading(false)
  }, [coupleId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(uniqueChannelTopic(`cycle-calendar-${coupleId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cycle_shares',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = asRow(payload.old)
            if (old) {
              setPeriods((current) => current.filter((period) => period.id !== old.id))
            }
            return
          }
          const row = asRow(payload.new)
          if (row) {
            const next = rowToPeriod(row)
            setPeriods((current) =>
              [...current.filter((period) => period.id !== next.id), next].sort((a, b) =>
                b.periodStart.localeCompare(a.periodStart),
              ),
            )
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId])

  return { periods, loading, error }
}

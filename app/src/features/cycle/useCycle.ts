import { useCallback, useEffect, useState } from 'react'

import { fromDateKey } from '../../core/dates'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Cycle tracker (state layer). Health data: the logs are owner-only in RLS;
 * the couple only ever sees `cycle_shares` — the manual summaries the owner
 * creates, and, while `profiles.cycle_calendar_share` is on, the date ranges
 * reconciled from her own logs (source = 'auto', dates only).
 */

export interface CycleLog {
  id: string
  logDate: string
  flow: number | null
  mood: number | null
  symptoms: string[]
  notes: string | null
}

export interface CycleLogInput {
  flow: number | null
  mood: number | null
  symptoms: string[]
  notes: string | null
}

export type ShareLevel = 'summary' | 'dates_only'
export type ShareSource = 'manual' | 'auto'

export interface CycleShare {
  id: string
  userId: string
  periodStart: string
  periodEnd: string | null
  shareLevel: ShareLevel
  source: ShareSource
}

interface CycleLogRow {
  id: string
  log_date: string
  flow: number | null
  mood: number | null
  symptoms: unknown
  notes: string | null
}

interface CycleShareRow {
  id: string
  user_id: string
  period_start: string
  period_end: string | null
  share_level: string
  source: string
}

const LOG_COLUMNS = 'id, log_date, flow, mood, symptoms, notes'
const SHARE_COLUMNS = 'id, user_id, period_start, period_end, share_level, source'

function asSymptoms(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function rowToLog(row: CycleLogRow): CycleLog {
  return {
    id: row.id,
    logDate: row.log_date,
    flow: row.flow,
    mood: row.mood,
    symptoms: asSymptoms(row.symptoms),
    notes: row.notes,
  }
}

function rowToShare(row: CycleShareRow): CycleShare {
  return {
    id: row.id,
    userId: row.user_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    shareLevel: row.share_level === 'dates_only' ? 'dates_only' : 'summary',
    source: row.source === 'auto' ? 'auto' : 'manual',
  }
}

const DAY_MS = 86_400_000

function daysBetween(a: string, b: string): number {
  return Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / DAY_MS)
}

/**
 * Periods computed from the owner's logs: runs of consecutive days with a
 * flow value; a single missing day inside a run stays part of the same period.
 */
export function periodRanges(logs: CycleLog[]): Array<{ start: string; end: string }> {
  const days = [...new Set(logs.filter((log) => log.flow !== null).map((log) => log.logDate))].sort()
  const ranges: Array<{ start: string; end: string }> = []
  for (const day of days) {
    const last = ranges[ranges.length - 1]
    if (last && daysBetween(last.end, day) <= 2) last.end = day
    else ranges.push({ start: day, end: day })
  }
  return ranges
}

export function useCycle() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [consentAt, setConsentAt] = useState<string | null>(null)
  const [calendarShare, setCalendarShareState] = useState(false)
  const [sex, setSex] = useState<string | null>(null)
  const [consentLoading, setConsentLoading] = useState(true)
  const [logs, setLogs] = useState<CycleLog[]>([])
  const [shares, setShares] = useState<CycleShare[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reloadShares = useCallback(async () => {
    const { data, error: sharesError } = await supabase
      .from('cycle_shares')
      .select(SHARE_COLUMNS)
      .order('period_start', { ascending: false })
      .limit(100)
    if (sharesError) throw new Error(sharesError.message)
    setShares(((data ?? []) as unknown as CycleShareRow[]).map(rowToShare))
  }, [])

  const refresh = useCallback(async () => {
    if (!userId) {
      setConsentLoading(false)
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('cycle_consent_at, cycle_calendar_share, sex')
      .eq('id', userId)
      .single()
    if (profileError) {
      setError(profileError.message)
    } else {
      setConsentAt((profile?.cycle_consent_at as string | null) ?? null)
      setCalendarShareState(Boolean(profile?.cycle_calendar_share))
      setSex((profile?.sex as string | null) ?? null)
    }
    setConsentLoading(false)

    const { data: logRows, error: logsError } = await supabase
      .from('cycle_logs')
      .select(LOG_COLUMNS)
      .order('log_date', { ascending: false })
      .limit(400)
    if (logsError) {
      setError(logsError.message)
    } else {
      setError(null)
      setLogs(((logRows ?? []) as unknown as CycleLogRow[]).map(rowToLog))
    }

    try {
      await reloadShares()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di caricamento dei riepiloghi.')
    }

    setLoading(false)
  }, [reloadShares, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setConsent = useCallback(
    async (on: boolean) => {
      if (!userId) throw new Error('Sessione non ancora caricata.')
      const stamp = on ? new Date().toISOString() : null
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cycle_consent_at: stamp })
        .eq('id', userId)
      if (updateError) throw new Error(updateError.message)
      setConsentAt(stamp)
    },
    [userId],
  )

  /**
   * Reconciles the couple-visible `source = 'auto'` shares with the periods
   * computed from the owner's logs. Manual summaries are never touched; only
   * dates are published.
   */
  const syncCalendarShares = useCallback(
    async (sourceLogs: CycleLog[]) => {
      if (!userId || !coupleId) return
      const desired = periodRanges(sourceLogs)
      const desiredByStart = new Map(desired.map((range) => [range.start, range]))

      const { data, error: readError } = await supabase
        .from('cycle_shares')
        .select(SHARE_COLUMNS)
        .eq('user_id', userId)
        .eq('source', 'auto')
      if (readError) throw new Error(readError.message)
      const auto = ((data ?? []) as unknown as CycleShareRow[]).map(rowToShare)

      const stale = auto.filter((share) => !desiredByStart.has(share.periodStart))
      const changed = auto.filter((share) => {
        const want = desiredByStart.get(share.periodStart)
        return want !== undefined && (share.periodEnd ?? share.periodStart) !== want.end
      })
      const missing = desired.filter(
        (range) => !auto.some((share) => share.periodStart === range.start),
      )

      for (const share of stale) {
        const { error: deleteError } = await supabase
          .from('cycle_shares')
          .delete()
          .eq('id', share.id)
        if (deleteError) throw new Error(deleteError.message)
      }
      for (const share of changed) {
        const want = desiredByStart.get(share.periodStart)
        if (!want) continue
        const { error: updateError } = await supabase
          .from('cycle_shares')
          .update({ period_end: want.end, share_level: 'dates_only' })
          .eq('id', share.id)
        if (updateError) throw new Error(updateError.message)
      }
      if (missing.length > 0) {
        const { error: insertError } = await supabase.from('cycle_shares').insert(
          missing.map((range) => ({
            couple_id: coupleId,
            user_id: userId,
            period_start: range.start,
            period_end: range.end,
            share_level: 'dates_only',
            source: 'auto',
          })),
        )
        if (insertError) throw new Error(insertError.message)
      }
      if (stale.length > 0 || changed.length > 0 || missing.length > 0) await reloadShares()
    },
    [coupleId, reloadShares, userId],
  )

  const clearCalendarShares = useCallback(async () => {
    if (!userId) return
    const { error: deleteError } = await supabase
      .from('cycle_shares')
      .delete()
      .eq('user_id', userId)
      .eq('source', 'auto')
    if (deleteError) throw new Error(deleteError.message)
    await reloadShares()
  }, [reloadShares, userId])

  /** The explicit, revocable "show the cycle on the shared calendar" switch. */
  const setCalendarShare = useCallback(
    async (on: boolean) => {
      if (!userId) throw new Error('Sessione non ancora caricata.')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cycle_calendar_share: on })
        .eq('id', userId)
      if (updateError) throw new Error(updateError.message)
      setCalendarShareState(on)
      if (on) await syncCalendarShares(logs)
      else await clearCalendarShares()
    },
    [clearCalendarShares, logs, syncCalendarShares, userId],
  )

  const saveLog = useCallback(
    async (logDate: string, input: CycleLogInput) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: saveError } = await supabase
        .from('cycle_logs')
        .upsert(
          {
            couple_id: coupleId,
            user_id: userId,
            log_date: logDate,
            flow: input.flow,
            mood: input.mood,
            symptoms: input.symptoms,
            notes: input.notes,
          },
          { onConflict: 'user_id,log_date' },
        )
        .select(LOG_COLUMNS)
        .single()
      if (saveError) throw new Error(saveError.message)
      const saved = rowToLog(data as unknown as CycleLogRow)
      const nextLogs = [saved, ...logs.filter((log) => log.logDate !== logDate)]
      setLogs(nextLogs)
      if (calendarShare) {
        try {
          await syncCalendarShares(nextLogs)
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Il calendario condiviso non è stato aggiornato.',
          )
        }
      }
    },
    [calendarShare, coupleId, logs, syncCalendarShares, userId],
  )

  const deleteLog = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from('cycle_logs').delete().eq('id', id)
      if (deleteError) throw new Error(deleteError.message)
      const nextLogs = logs.filter((log) => log.id !== id)
      setLogs(nextLogs)
      if (calendarShare) {
        try {
          await syncCalendarShares(nextLogs)
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Il calendario condiviso non è stato aggiornato.',
          )
        }
      }
    },
    [calendarShare, logs, syncCalendarShares],
  )

  const sharePeriod = useCallback(
    async (periodStart: string, periodEnd: string | null, shareLevel: ShareLevel) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('cycle_shares')
        .insert({
          couple_id: coupleId,
          user_id: userId,
          period_start: periodStart,
          period_end: periodEnd,
          share_level: shareLevel,
          source: 'manual',
        })
        .select(SHARE_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setShares((current) => [rowToShare(data as unknown as CycleShareRow), ...current])
    },
    [coupleId, userId],
  )

  const deleteShare = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('cycle_shares').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setShares((current) => current.filter((share) => share.id !== id))
  }, [])

  return {
    consentAt,
    calendarShare,
    sex,
    consentLoading,
    logs,
    shares,
    loading,
    error,
    refresh,
    setConsent,
    setCalendarShare,
    saveLog,
    deleteLog,
    sharePeriod,
    deleteShare,
  }
}

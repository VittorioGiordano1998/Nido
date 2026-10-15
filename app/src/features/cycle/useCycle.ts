import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Cycle tracker (state layer). Health data: the logs are owner-only in RLS;
 * only the explicit summaries the owner creates (`cycle_shares`) are visible
 * to the partner. Everything stays behind `profiles.cycle_consent_at`.
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

export interface CycleShare {
  id: string
  userId: string
  periodStart: string
  periodEnd: string | null
  shareLevel: ShareLevel
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
}

const LOG_COLUMNS = 'id, log_date, flow, mood, symptoms, notes'
const SHARE_COLUMNS = 'id, user_id, period_start, period_end, share_level'

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
  }
}

export function useCycle() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [consentAt, setConsentAt] = useState<string | null>(null)
  const [consentLoading, setConsentLoading] = useState(true)
  const [logs, setLogs] = useState<CycleLog[]>([])
  const [shares, setShares] = useState<CycleShare[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setConsentLoading(false)
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('cycle_consent_at')
      .eq('id', userId)
      .single()
    if (profileError) setError(profileError.message)
    else setConsentAt((profile?.cycle_consent_at as string | null) ?? null)
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

    const { data: shareRows, error: sharesError } = await supabase
      .from('cycle_shares')
      .select(SHARE_COLUMNS)
      .order('period_start', { ascending: false })
      .limit(50)
    if (sharesError) {
      setError(sharesError.message)
    } else {
      setShares(((shareRows ?? []) as unknown as CycleShareRow[]).map(rowToShare))
    }

    setLoading(false)
  }, [userId])

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
      setLogs((current) => [saved, ...current.filter((log) => log.logDate !== logDate)])
    },
    [coupleId, userId],
  )

  const deleteLog = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('cycle_logs').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setLogs((current) => current.filter((log) => log.id !== id))
  }, [])

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
    consentLoading,
    logs,
    shares,
    loading,
    error,
    refresh,
    setConsent,
    saveLog,
    deleteLog,
    sharePeriod,
    deleteShare,
  }
}

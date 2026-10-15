import { useCallback, useEffect, useState } from 'react'

import { toDateKey } from '../../core/dates'
import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Weekly plan (state layer): one proposal per week (Monday-based), accept /
 * decline / replace, Realtime on `week_plans`. "One pending per week" is a
 * client-side convention, accepted for the MVP (TASK-WEEK-…-001 notes).
 */

export type WeekPlanStatus = 'pending' | 'accepted' | 'declined' | 'replaced'

export interface WeekPlan {
  id: string
  coupleId: string
  weekStart: string
  proposal: string
  status: WeekPlanStatus
  createdBy: string
  createdAt: string
}

interface WeekPlanRow {
  id: string
  couple_id: string
  week_start: string
  proposal: string
  status: string
  created_by: string
  created_at: string
}

const WEEK_PLAN_COLUMNS = 'id, couple_id, week_start, proposal, status, created_by, created_at'
const STATUSES: readonly WeekPlanStatus[] = ['pending', 'accepted', 'declined', 'replaced']

/** Monday of the current local week, as YYYY-MM-DD. */
export function currentWeekStart(today = new Date()): string {
  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - ((today.getDay() + 6) % 7),
  )
  return toDateKey(monday)
}

function rowToPlan(row: WeekPlanRow): WeekPlan {
  return {
    id: row.id,
    coupleId: row.couple_id,
    weekStart: row.week_start,
    proposal: row.proposal,
    status: STATUSES.includes(row.status as WeekPlanStatus)
      ? (row.status as WeekPlanStatus)
      : 'pending',
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

export function useWeekPlan() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [plans, setPlans] = useState<WeekPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setPlans([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('week_plans')
      .select(WEEK_PLAN_COLUMNS)
      .eq('couple_id', coupleId)
      .order('week_start', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)
    if (loadError) {
      setError(loadError.message)
    } else {
      setPlans(((data ?? []) as unknown as WeekPlanRow[]).map(rowToPlan))
      setError(null)
    }
    setLoading(false)
  }, [coupleId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(uniqueChannelTopic(`week-plans-${coupleId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'week_plans', filter: `couple_id=eq.${coupleId}` },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId, refresh])

  const propose = useCallback(
    async (proposal: string) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { error: insertError } = await supabase.from('week_plans').insert({
        couple_id: coupleId,
        week_start: currentWeekStart(),
        proposal,
        created_by: userId,
      })
      if (insertError) throw new Error(insertError.message)
      await refresh()
    },
    [coupleId, userId, refresh],
  )

  const setStatus = useCallback(
    async (id: string, status: 'accepted' | 'declined') => {
      const { data, error: updateError } = await supabase
        .from('week_plans')
        .update({ status })
        .eq('id', id)
        .select(WEEK_PLAN_COLUMNS)
        .single()
      if (updateError) throw new Error(updateError.message)
      const updated = rowToPlan(data as unknown as WeekPlanRow)
      setPlans((current) => current.map((plan) => (plan.id === id ? updated : plan)))
    },
    [],
  )

  const replace = useCallback(
    async (id: string, proposal: string) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { error: replaceError } = await supabase
        .from('week_plans')
        .update({ status: 'replaced' })
        .eq('id', id)
      if (replaceError) throw new Error(replaceError.message)
      const { error: insertError } = await supabase.from('week_plans').insert({
        couple_id: coupleId,
        week_start: currentWeekStart(),
        proposal,
        created_by: userId,
      })
      if (insertError) throw new Error(insertError.message)
      await refresh()
    },
    [coupleId, userId, refresh],
  )

  return { plans, loading, error, refresh, propose, setStatus, replace }
}

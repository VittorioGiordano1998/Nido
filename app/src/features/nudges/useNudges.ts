import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Partner nudges (state layer): one insert per tap; the `send-push` database
 * webhook turns the row into a Web Push notification, and the hub list stays
 * live through Realtime. Nudges are immutable (solo insert).
 */

export interface Nudge {
  id: string
  coupleId: string
  taskId: string | null
  fromUser: string
  toUser: string
  message: string | null
  createdAt: string
}

export const NUDGE_MESSAGES = [
  'Ti ricordo io 💛',
  'Pensami un attimo 💭',
  'Ricordati di me, quando puoi',
  'Cosa mi dici di quella cosa?',
] as const

interface NudgeRow {
  id: string
  couple_id: string
  task_id: string | null
  from_user: string
  to_user: string
  message: string | null
  created_at: string
}

const NUDGE_COLUMNS = 'id, couple_id, task_id, from_user, to_user, message, created_at'

function rowToNudge(row: NudgeRow): Nudge {
  return {
    id: row.id,
    coupleId: row.couple_id,
    taskId: row.task_id,
    fromUser: row.from_user,
    toUser: row.to_user,
    message: row.message,
    createdAt: row.created_at,
  }
}

export function useNudges() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [nudges, setNudges] = useState<Nudge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setNudges([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('nudges')
      .select(NUDGE_COLUMNS)
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
      .limit(15)
    if (loadError) {
      setError(loadError.message)
    } else {
      setNudges(((data ?? []) as unknown as NudgeRow[]).map(rowToNudge))
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
      .channel(`nudges-${coupleId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'nudges', filter: `couple_id=eq.${coupleId}` },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId, refresh])

  const sendNudge = useCallback(
    async (
      toUser: string,
      options: { taskId?: string | null; message?: string | null } = {},
    ) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('nudges')
        .insert({
          couple_id: coupleId,
          task_id: options.taskId ?? null,
          from_user: userId,
          to_user: toUser,
          message: options.message ?? null,
        })
        .select(NUDGE_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setNudges((current) => [rowToNudge(data as unknown as NudgeRow), ...current])
    },
    [coupleId, userId],
  )

  return { nudges, loading, error, refresh, sendNudge }
}

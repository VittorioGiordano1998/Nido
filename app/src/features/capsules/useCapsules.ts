import { useCallback, useEffect, useMemo, useState } from 'react'

import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

export interface Capsule {
  id: string
  coupleId: string
  title: string
  body: string
  opensAt: string
  createdBy: string
  createdAt: string
}

export interface CapsuleInput {
  title: string
  body: string
  opensAt: string
}

interface CapsuleRow {
  id: string
  couple_id: string
  title: string | null
  body: string | null
  opens_at: string
  created_by: string
  created_at: string
}

const CAPSULE_COLUMNS = 'id, couple_id, title, body, opens_at, created_by, created_at'

function rowToCapsule(row: CapsuleRow): Capsule {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title ?? '',
    body: row.body ?? '',
    opensAt: row.opens_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

function upsertCapsule(capsules: Capsule[], next: Capsule): Capsule[] {
  return [...capsules.filter((capsule) => capsule.id !== next.id), next].sort((a, b) =>
    a.opensAt.localeCompare(b.opensAt),
  )
}

function hasId(value: unknown): value is { id: string } {
  return (
    typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string'
  )
}

/**
 * Capsule del tempo (state layer): la RLS mostra al partner solo le capsule
 * con `opens_at <= oggi`; qui carichiamo quello che l'account può vedere, con
 * Realtime su `time_capsules`.
 */
export function useCapsules() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setCapsules([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('time_capsules')
      .select(CAPSULE_COLUMNS)
      .eq('couple_id', coupleId)
      .order('opens_at', { ascending: true })
    if (loadError) {
      setError(loadError.message)
    } else {
      setCapsules(((data ?? []) as unknown as CapsuleRow[]).map(rowToCapsule))
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
      .channel(uniqueChannelTopic(`capsules-${coupleId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_capsules',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if (hasId(payload.old)) {
              const removed = payload.old.id
              setCapsules((current) => current.filter((capsule) => capsule.id !== removed))
            }
            return
          }
          if (hasId(payload.new)) {
            const row = payload.new as unknown as CapsuleRow
            setCapsules((current) => upsertCapsule(current, rowToCapsule(row)))
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId])

  const createCapsule = useCallback(
    async (input: CapsuleInput) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('time_capsules')
        .insert({
          couple_id: coupleId,
          created_by: userId,
          title: input.title,
          body: input.body,
          opens_at: input.opensAt,
        })
        .select(CAPSULE_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setCapsules((current) => upsertCapsule(current, rowToCapsule(data as unknown as CapsuleRow)))
    },
    [coupleId, userId],
  )

  const updateCapsule = useCallback(async (id: string, input: CapsuleInput) => {
    const { data, error: updateError } = await supabase
      .from('time_capsules')
      .update({ title: input.title, body: input.body, opens_at: input.opensAt })
      .eq('id', id)
      .select(CAPSULE_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    setCapsules((current) => upsertCapsule(current, rowToCapsule(data as unknown as CapsuleRow)))
  }, [])

  const deleteCapsule = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('time_capsules').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setCapsules((current) => current.filter((capsule) => capsule.id !== id))
  }, [])

  const value = useMemo(
    () => ({ capsules, loading, error, refresh, createCapsule, updateCapsule, deleteCapsule }),
    [capsules, loading, error, refresh, createCapsule, updateCapsule, deleteCapsule],
  )
  return value
}

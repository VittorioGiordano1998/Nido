import { useCallback, useEffect, useMemo, useState } from 'react'

import { subscribeToAppResync } from '../../core/resync'
import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Sticky notes (state layer, TASK-STICK-…-001): short notes one partner
 * leaves on the other's Home, dismissed by the recipient or retracted by the
 * author. Realtime on `stickies`.
 */

export interface Sticky {
  id: string
  coupleId: string
  fromUser: string
  toUser: string
  body: string
  createdAt: string
}

/** One sticky, capped: it is a note on the fridge, not a document. */
export const STICKY_MAX_LENGTH = 200

interface StickyRow {
  id: string
  couple_id: string
  from_user: string
  to_user: string
  body: string
  created_at: string
}

const STICKY_COLUMNS = 'id, couple_id, from_user, to_user, body, created_at'

function rowToSticky(row: StickyRow): Sticky {
  return {
    id: row.id,
    coupleId: row.couple_id,
    fromUser: row.from_user,
    toUser: row.to_user,
    body: row.body,
    createdAt: row.created_at,
  }
}

function upsertSticky(stickies: Sticky[], next: Sticky): Sticky[] {
  return [...stickies.filter((sticky) => sticky.id !== next.id), next].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}

function hasId(value: unknown): value is { id: string } {
  return (
    typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string'
  )
}

export function useStickies() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null
  const partnerId =
    couple?.members.find((member) => member.userId !== userId)?.userId ?? null

  const [stickies, setStickies] = useState<Sticky[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setStickies([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('stickies')
      .select(STICKY_COLUMNS)
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
    if (loadError) {
      setError(loadError.message)
    } else {
      setStickies(((data ?? []) as unknown as StickyRow[]).map(rowToSticky))
      setError(null)
    }
    setLoading(false)
  }, [coupleId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Silent resync when the app comes back to the foreground (TASK-ROB-…-002).
  useEffect(() => subscribeToAppResync(() => void refresh()), [refresh])

  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(uniqueChannelTopic(`stickies-${coupleId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stickies', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if (hasId(payload.old)) {
              const removed = payload.old.id
              setStickies((current) => current.filter((sticky) => sticky.id !== removed))
            }
            return
          }
          if (hasId(payload.new)) {
            setStickies((current) =>
              upsertSticky(current, rowToSticky(payload.new as unknown as StickyRow)),
            )
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId])

  const received = useMemo(
    () => stickies.filter((sticky) => sticky.toUser === userId),
    [stickies, userId],
  )
  const sent = useMemo(
    () => stickies.filter((sticky) => sticky.fromUser === userId),
    [stickies, userId],
  )

  const send = useCallback(
    async (body: string) => {
      const text = body.trim()
      if (!coupleId || !userId || !partnerId) throw new Error('Coppia non ancora caricata.')
      if (!text) throw new Error('Il bigliettino è vuoto.')
      const { data, error: insertError } = await supabase
        .from('stickies')
        .insert({
          couple_id: coupleId,
          from_user: userId,
          to_user: partnerId,
          body: text.slice(0, STICKY_MAX_LENGTH),
        })
        .select(STICKY_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setStickies((current) => upsertSticky(current, rowToSticky(data as unknown as StickyRow)))
    },
    [coupleId, userId, partnerId],
  )

  const dismiss = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('stickies').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setStickies((current) => current.filter((sticky) => sticky.id !== id))
  }, [])

  /** Re-inserts a dismissed/retracted sticky (undo toast, TASK-UI-…-001). */
  const restore = useCallback(async (sticky: Sticky) => {
    const { data, error: insertError } = await supabase
      .from('stickies')
      .insert({
        id: sticky.id,
        couple_id: sticky.coupleId,
        from_user: sticky.fromUser,
        to_user: sticky.toUser,
        body: sticky.body,
      })
      .select(STICKY_COLUMNS)
      .single()
    if (insertError) throw new Error(insertError.message)
    setStickies((current) => upsertSticky(current, rowToSticky(data as unknown as StickyRow)))
  }, [])

  return {
    stickies,
    received,
    sent,
    loading,
    error,
    send,
    dismiss,
    retract: dismiss,
    restore,
    refresh,
  }
}

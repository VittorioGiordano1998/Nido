import { useCallback, useEffect, useMemo, useState } from 'react'

import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Bucket list (state layer, TASK-BUCKET-…-001): experiences to do together,
 * manual order, done date; the journal link lives in `memories.bucket_item_id`
 * and is read through `useMemories`. Realtime on `bucket_items`.
 */

export interface BucketItem {
  id: string
  coupleId: string
  title: string
  note: string
  doneAt: string | null
  position: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface BucketRow {
  id: string
  couple_id: string
  title: string
  note: string | null
  done_at: string | null
  position: number
  created_by: string
  created_at: string
  updated_at: string
}

const BUCKET_COLUMNS =
  'id, couple_id, title, note, done_at, position, created_by, created_at, updated_at'

function rowToItem(row: BucketRow): BucketItem {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title,
    note: row.note ?? '',
    doneAt: row.done_at,
    position: row.position,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function upsertItem(items: BucketItem[], next: BucketItem): BucketItem[] {
  return [...items.filter((item) => item.id !== next.id), next].sort(
    (a, b) => a.position - b.position,
  )
}

function hasId(value: unknown): value is { id: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string'
  )
}

export function useBucket() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [items, setItems] = useState<BucketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('bucket_items')
      .select(BUCKET_COLUMNS)
      .eq('couple_id', coupleId)
      .order('position', { ascending: true })
    if (loadError) {
      setError(loadError.message)
    } else {
      setItems(((data ?? []) as unknown as BucketRow[]).map(rowToItem))
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
      .channel(uniqueChannelTopic(`bucket-${coupleId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bucket_items',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if (hasId(payload.old)) {
              const removed = payload.old.id
              setItems((current) => current.filter((item) => item.id !== removed))
            }
            return
          }
          if (hasId(payload.new)) {
            setItems((current) => upsertItem(current, rowToItem(payload.new as unknown as BucketRow)))
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId])

  const addItem = useCallback(
    async (title: string) => {
      const text = title.trim()
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      if (!text) throw new Error('Serve un titolo.')
      const position = items.reduce((max, item) => Math.max(max, item.position), 0) + 1
      const { data, error: insertError } = await supabase
        .from('bucket_items')
        .insert({ couple_id: coupleId, created_by: userId, title: text, position })
        .select(BUCKET_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setItems((current) => upsertItem(current, rowToItem(data as unknown as BucketRow)))
    },
    [coupleId, userId, items],
  )

  const toggleItem = useCallback(async (id: string, done: boolean) => {
    const { data, error: updateError } = await supabase
      .from('bucket_items')
      .update({ done_at: done ? new Date().toISOString() : null })
      .eq('id', id)
      .select(BUCKET_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    setItems((current) => upsertItem(current, rowToItem(data as unknown as BucketRow)))
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('bucket_items').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  /** Re-inserts a deleted item (undo toast, TASK-UI-…-001). */
  const restoreItem = useCallback(async (item: BucketItem) => {
    const { data, error: insertError } = await supabase
      .from('bucket_items')
      .insert({
        id: item.id,
        couple_id: item.coupleId,
        created_by: item.createdBy,
        title: item.title,
        note: item.note || null,
        done_at: item.doneAt,
        position: item.position,
      })
      .select(BUCKET_COLUMNS)
      .single()
    if (insertError) throw new Error(insertError.message)
    setItems((current) => upsertItem(current, rowToItem(data as unknown as BucketRow)))
  }, [])

  const done = useMemo(() => items.filter((item) => item.doneAt !== null), [items])
  const open = useMemo(() => items.filter((item) => item.doneAt === null), [items])

  return { items, open, done, loading, error, addItem, toggleItem, deleteItem, restoreItem, refresh }
}

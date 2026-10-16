import { useCallback, useEffect, useState } from 'react'

import { subscribeToAppResync } from '../../core/resync'
import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { removeMemoryPhotoIfUnused, signMemoryUrls, uploadMemoryPhoto } from './photos'

/**
 * Memories (state layer, TASK-MEMO-…-001): the couple's photo journal, newest
 * first, with signed URLs for the private bucket. Realtime on `memories`.
 */

export interface Memory {
  id: string
  coupleId: string
  photoPath: string
  caption: string
  takenOn: string
  bucketItemId: string | null
  createdBy: string
  createdAt: string
}

export interface MemoryInput {
  file: File
  caption: string
  takenOn: string
  bucketItemId?: string | null
}

interface MemoryRow {
  id: string
  couple_id: string
  photo_path: string
  caption: string | null
  taken_on: string
  bucket_item_id: string | null
  created_by: string
  created_at: string
}

const MEMORY_COLUMNS =
  'id, couple_id, photo_path, caption, taken_on, bucket_item_id, created_by, created_at'

function rowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    coupleId: row.couple_id,
    photoPath: row.photo_path,
    caption: row.caption ?? '',
    takenOn: row.taken_on,
    bucketItemId: row.bucket_item_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

function upsertMemory(memories: Memory[], next: Memory): Memory[] {
  return [...memories.filter((memory) => memory.id !== next.id), next].sort(
    (a, b) => b.takenOn.localeCompare(a.takenOn) || b.createdAt.localeCompare(a.createdAt),
  )
}

function hasId(value: unknown): value is { id: string } {
  return (
    typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string'
  )
}

export function useMemories() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [memories, setMemories] = useState<Memory[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setMemories([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('memories')
      .select(MEMORY_COLUMNS)
      .eq('couple_id', coupleId)
      .order('taken_on', { ascending: false })
      .order('created_at', { ascending: false })
    if (loadError) {
      setError(loadError.message)
    } else {
      setMemories(((data ?? []) as unknown as MemoryRow[]).map(rowToMemory))
      setError(null)
    }
    setLoading(false)
  }, [coupleId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Silent resync when the app comes back to the foreground (TASK-ROB-…-002).
  useEffect(() => subscribeToAppResync(() => void refresh()), [refresh])

  // Signed URLs for every path (re-signed when the set changes).
  const pathsKey = [...new Set(memories.map((memory) => memory.photoPath))].sort().join('|')
  useEffect(() => {
    const list = pathsKey ? pathsKey.split('|') : []
    if (list.length === 0) {
      setUrls({})
      return
    }
    let active = true
    void signMemoryUrls(list)
      .then((map) => {
        if (active) setUrls(map)
      })
      .catch(() => {
        // A missing URL shows the placeholder: nothing to report here.
      })
    return () => {
      active = false
    }
  }, [pathsKey])

  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(uniqueChannelTopic(`memories-${coupleId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if (hasId(payload.old)) {
              const removed = payload.old.id
              setMemories((current) => current.filter((memory) => memory.id !== removed))
            }
            return
          }
          if (hasId(payload.new)) {
            setMemories((current) =>
              upsertMemory(current, rowToMemory(payload.new as unknown as MemoryRow)),
            )
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId])

  /** Uploads the photo then inserts the row; returns the stored memory. */
  const createMemory = useCallback(
    async (input: MemoryInput): Promise<Memory> => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const path = await uploadMemoryPhoto(coupleId, input.file)
      const { data, error: insertError } = await supabase
        .from('memories')
        .insert({
          couple_id: coupleId,
          created_by: userId,
          photo_path: path,
          caption: input.caption.trim() || null,
          taken_on: input.takenOn,
          bucket_item_id: input.bucketItemId ?? null,
        })
        .select(MEMORY_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      const memory = rowToMemory(data as unknown as MemoryRow)
      setMemories((current) => upsertMemory(current, memory))
      return memory
    },
    [coupleId, userId],
  )

  /** Removes the row; the photo object goes away with `purgePhoto` (undo window). */
  const deleteMemory = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('memories').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setMemories((current) => current.filter((memory) => memory.id !== id))
  }, [])

  /** Edits caption and date; the photo stays (TASK-MEMO-…-003). */
  const updateMemory = useCallback(
    async (id: string, input: { caption: string; takenOn: string }) => {
      const { data, error: updateError } = await supabase
        .from('memories')
        .update({ caption: input.caption.trim() || null, taken_on: input.takenOn })
        .eq('id', id)
        .select(MEMORY_COLUMNS)
        .single()
      if (updateError) throw new Error(updateError.message)
      setMemories((current) => upsertMemory(current, rowToMemory(data as unknown as MemoryRow)))
    },
    [],
  )

  /** Re-inserts a deleted memory (undo toast, TASK-UI-…-001). */
  const restoreMemory = useCallback(async (memory: Memory) => {
    const { data, error: insertError } = await supabase
      .from('memories')
      .insert({
        id: memory.id,
        couple_id: memory.coupleId,
        created_by: memory.createdBy,
        photo_path: memory.photoPath,
        caption: memory.caption || null,
        taken_on: memory.takenOn,
        bucket_item_id: memory.bucketItemId,
      })
      .select(MEMORY_COLUMNS)
      .single()
    if (insertError) throw new Error(insertError.message)
    setMemories((current) => upsertMemory(current, rowToMemory(data as unknown as MemoryRow)))
  }, [])

  /** Best-effort storage cleanup, used when the undo window closes. */
  const purgePhoto = useCallback(async (path: string) => {
    await removeMemoryPhotoIfUnused(path)
  }, [])

  return {
    memories,
    urls,
    loading,
    error,
    createMemory,
    updateMemory,
    deleteMemory,
    restoreMemory,
    purgePhoto,
    refresh,
  }
}

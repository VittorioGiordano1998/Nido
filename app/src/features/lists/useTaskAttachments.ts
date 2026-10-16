import { useCallback, useEffect, useMemo, useState } from 'react'

import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { clampFraming, removePhotoIfUnused, signPhotoUrls, uploadListPhoto } from './photos'
import type { Framing } from './photos'

/**
 * Item attachments (state layer): photos, links and notes for the couple's
 * list items, plus the backdrop choice and its framing (one photo per item).
 * Photos live in the private `list-photos` bucket and are shown through
 * signed URLs; rows sync over Realtime.
 */

export type AttachmentKind = 'photo' | 'link' | 'note'

export interface TaskAttachment {
  id: string
  taskId: string
  coupleId: string
  kind: AttachmentKind
  value: string
  caption: string | null
  createdBy: string
  createdAt: string
  /** One per item: the photo used as the card's backdrop. */
  isBackdrop: boolean
  bgX: number
  bgY: number
  bgZoom: number
}

interface AttachmentRow {
  id: string
  task_id: string
  couple_id: string
  kind: string
  value: string
  caption: string | null
  created_by: string
  created_at: string
  is_backdrop: boolean
  bg_x: number | null
  bg_y: number | null
  bg_zoom: number | null
}

const ATTACHMENT_COLUMNS =
  'id, task_id, couple_id, kind, value, caption, created_by, created_at, is_backdrop, bg_x, bg_y, bg_zoom'

function rowToAttachment(row: AttachmentRow): TaskAttachment {
  const kind: AttachmentKind = row.kind === 'photo' || row.kind === 'note' ? row.kind : 'link'
  return {
    id: row.id,
    taskId: row.task_id,
    coupleId: row.couple_id,
    kind,
    value: row.value,
    caption: row.caption,
    createdBy: row.created_by,
    createdAt: row.created_at,
    isBackdrop: Boolean(row.is_backdrop),
    bgX: row.bg_x ?? 50,
    bgY: row.bg_y ?? 50,
    bgZoom: row.bg_zoom ?? 1,
  }
}

function asRow(value: unknown): AttachmentRow | null {
  return typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string'
    ? (value as unknown as AttachmentRow)
    : null
}

function upsertAttachment(list: TaskAttachment[], next: TaskAttachment): TaskAttachment[] {
  return [...list.filter((attachment) => attachment.id !== next.id), next].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )
}

export function useTaskAttachments() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const signPhotos = useCallback(async (rows: TaskAttachment[]) => {
    const paths = [...new Set(rows.filter((row) => row.kind === 'photo').map((row) => row.value))]
    if (paths.length === 0) {
      setPhotoUrls({})
      return
    }
    try {
      setPhotoUrls(await signPhotoUrls(paths))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento delle foto.')
    }
  }, [])

  const signOne = useCallback(async (path: string) => {
    try {
      const urls = await signPhotoUrls([path])
      if (urls[path]) setPhotoUrls((current) => ({ ...current, [path]: urls[path] as string }))
    } catch {
      // La miniatura resta al placeholder: niente da segnalare qui.
    }
  }, [])

  const forgetPhoto = useCallback((path: string) => {
    setPhotoUrls((current) => {
      if (!(path in current)) return current
      const next = { ...current }
      delete next[path]
      return next
    })
  }, [])

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setAttachments([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('task_attachments')
      .select(ATTACHMENT_COLUMNS)
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: true })
    if (loadError) {
      setError(loadError.message)
    } else {
      const rows = ((data ?? []) as unknown as AttachmentRow[]).map(rowToAttachment)
      setAttachments(rows)
      setError(null)
      await signPhotos(rows)
    }
    setLoading(false)
  }, [coupleId, signPhotos])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(uniqueChannelTopic(`list-attachments-${coupleId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_attachments',
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = asRow(payload.old)
            if (old) {
              const removed = rowToAttachment(old)
              setAttachments((current) => current.filter((item) => item.id !== removed.id))
              if (removed.kind === 'photo') forgetPhoto(removed.value)
            }
            return
          }
          const row = asRow(payload.new)
          if (row) {
            const next = rowToAttachment(row)
            setAttachments((current) => upsertAttachment(current, next))
            if (next.kind === 'photo') void signOne(next.value)
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId, forgetPhoto, signOne])

  const addAttachment = useCallback(
    async (taskId: string, kind: AttachmentKind, value: string, caption: string | null) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('task_attachments')
        .insert({
          task_id: taskId,
          couple_id: coupleId,
          kind,
          value,
          caption: caption?.trim() || null,
          created_by: userId,
        })
        .select(ATTACHMENT_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      const saved = rowToAttachment(data as unknown as AttachmentRow)
      setAttachments((current) => upsertAttachment(current, saved))
      if (saved.kind === 'photo') await signOne(saved.value)
      return saved
    },
    [coupleId, signOne, userId],
  )

  /** Uploads the file and records the attachment; removes the object if the row fails. */
  const attachPhoto = useCallback(
    async (taskId: string, file: File, caption: string | null) => {
      if (!coupleId) throw new Error('Coppia non ancora caricata.')
      const path = await uploadListPhoto(coupleId, file)
      try {
        return await addAttachment(taskId, 'photo', path, caption)
      } catch (err) {
        await removePhotoIfUnused(path)
        throw err
      }
    },
    [addAttachment, coupleId],
  )

  const deleteAttachment = useCallback(
    async (attachment: TaskAttachment) => {
      const { error: deleteError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id)
      if (deleteError) throw new Error(deleteError.message)
      setAttachments((current) => current.filter((item) => item.id !== attachment.id))
      if (attachment.kind === 'photo') {
        forgetPhoto(attachment.value)
        await removePhotoIfUnused(attachment.value)
      }
    },
    [forgetPhoto],
  )

  /** Best-effort storage cleanup before deleting items or lists (rows cascade);
   *  objects still referenced elsewhere (a cover) are kept. */
  const removeStoredPhotos = useCallback(
    async (rows: TaskAttachment[]) => {
      const paths = [...new Set(rows.filter((row) => row.kind === 'photo').map((row) => row.value))]
      for (const path of paths) {
        forgetPhoto(path)
        await removePhotoIfUnused(path)
      }
    },
    [forgetPhoto],
  )

  /** Sets the item's backdrop (clearing any previous one) and stores the framing. */
  const setBackdrop = useCallback(async (attachment: TaskAttachment, framing: Framing) => {
    const clean = clampFraming(framing)
    const { error: clearError } = await supabase
      .from('task_attachments')
      .update({ is_backdrop: false })
      .eq('task_id', attachment.taskId)
      .eq('is_backdrop', true)
      .neq('id', attachment.id)
    if (clearError) throw new Error(clearError.message)
    const { data, error: updateError } = await supabase
      .from('task_attachments')
      .update({
        is_backdrop: true,
        bg_x: Math.round(clean.x),
        bg_y: Math.round(clean.y),
        bg_zoom: clean.zoom,
      })
      .eq('id', attachment.id)
      .select(ATTACHMENT_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    const saved = rowToAttachment(data as unknown as AttachmentRow)
    setAttachments((current) =>
      current.map((item) => {
        if (item.id === saved.id) return saved
        if (item.taskId === saved.taskId && item.isBackdrop) return { ...item, isBackdrop: false }
        return item
      }),
    )
  }, [])

  const clearBackdrop = useCallback(async (attachment: TaskAttachment) => {
    const { error: updateError } = await supabase
      .from('task_attachments')
      .update({ is_backdrop: false })
      .eq('id', attachment.id)
    if (updateError) throw new Error(updateError.message)
    setAttachments((current) =>
      current.map((item) => (item.id === attachment.id ? { ...item, isBackdrop: false } : item)),
    )
  }, [])

  const byTask = useMemo(() => {
    const map = new Map<string, TaskAttachment[]>()
    for (const attachment of attachments) {
      const list = map.get(attachment.taskId)
      if (list) list.push(attachment)
      else map.set(attachment.taskId, [attachment])
    }
    return map
  }, [attachments])

  return {
    attachments,
    byTask,
    photoUrls,
    loading,
    error,
    refresh,
    addAttachment,
    attachPhoto,
    deleteAttachment,
    removeStoredPhotos,
    setBackdrop,
    clearBackdrop,
  }
}

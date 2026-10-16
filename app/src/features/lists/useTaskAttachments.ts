import { useCallback, useEffect, useMemo, useState } from 'react'

import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Item attachments (state layer): photos, links and notes for the couple's
 * list items. Photos live in the private `list-photos` bucket and are shown
 * through short-lived signed URLs; rows sync over Realtime.
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
}

const PHOTO_BUCKET = 'list-photos'
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const SIGNED_URL_TTL_SECONDS = 3600

interface AttachmentRow {
  id: string
  task_id: string
  couple_id: string
  kind: string
  value: string
  caption: string | null
  created_by: string
  created_at: string
}

const ATTACHMENT_COLUMNS =
  'id, task_id, couple_id, kind, value, caption, created_by, created_at'

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

function photoPathFor(coupleId: string, file: File): string {
  const rawExt = file.name.includes('.') ? (file.name.split('.').pop() ?? 'jpg') : 'jpg'
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'jpg'
  return `${coupleId}/${crypto.randomUUID()}.${ext}`
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
    const { data, error: signError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)
    if (signError) {
      setError(signError.message)
      return
    }
    const urls: Record<string, string> = {}
    for (const entry of data ?? []) {
      if (entry.signedUrl && entry.path) urls[entry.path] = entry.signedUrl
    }
    setPhotoUrls(urls)
  }, [])

  const signOne = useCallback(async (path: string) => {
    const { data, error: signError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
    if (signError) return
    if (data?.signedUrl) setPhotoUrls((current) => ({ ...current, [path]: data.signedUrl }))
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
      if (!file.type.startsWith('image/')) throw new Error('Serve un file immagine.')
      if (file.size > MAX_PHOTO_BYTES) throw new Error('La foto supera 5 MB: scegline una più leggera.')
      const path = photoPathFor(coupleId, file)
      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, { contentType: file.type })
      if (uploadError) throw new Error(uploadError.message)
      try {
        return await addAttachment(taskId, 'photo', path, caption)
      } catch (err) {
        await supabase.storage.from(PHOTO_BUCKET).remove([path])
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
        await supabase.storage.from(PHOTO_BUCKET).remove([attachment.value])
      }
    },
    [forgetPhoto],
  )

  /** Best-effort storage cleanup before deleting items or lists (rows cascade). */
  const removeStoredPhotos = useCallback(
    async (rows: TaskAttachment[]) => {
      const paths = [...new Set(rows.filter((row) => row.kind === 'photo').map((row) => row.value))]
      if (paths.length === 0) return
      for (const path of paths) forgetPhoto(path)
      await supabase.storage.from(PHOTO_BUCKET).remove(paths)
    },
    [forgetPhoto],
  )

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
  }
}

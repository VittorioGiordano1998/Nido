import { useCallback, useEffect, useMemo, useState } from 'react'

import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

export interface Note {
  id: string
  coupleId: string
  title: string
  body: string
  createdBy: string
  updatedAt: string
}

export interface NoteInput {
  title: string
  body: string
}

interface NoteRow {
  id: string
  couple_id: string
  title: string | null
  body: string | null
  created_by: string
  updated_at: string
}

const NOTE_COLUMNS = 'id, couple_id, title, body, created_by, updated_at'

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title ?? '',
    body: row.body ?? '',
    createdBy: row.created_by,
    updatedAt: row.updated_at,
  }
}

function upsertNote(notes: Note[], next: Note): Note[] {
  return [next, ...notes.filter((note) => note.id !== next.id)].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )
}

function hasId(value: unknown): value is { id: string } {
  return (
    typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string'
  )
}

/** Anteprima breve del corpo di una nota (per liste e riepiloghi). */
export function notePreview(note: Note, max = 90): string {
  const body = note.body.trim()
  if (!body) return 'Nota vuota'
  return body.length > max ? `${body.slice(0, max)}…` : body
}

/**
 * Note condivise (state layer): caricamento per `updated_at` decrescente,
 * scritture e sincronizzazione Realtime. Ultimo salvataggio vince.
 */
export function useNotes() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setNotes([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('notes')
      .select(NOTE_COLUMNS)
      .eq('couple_id', coupleId)
      .order('updated_at', { ascending: false })
    if (loadError) {
      setError(loadError.message)
    } else {
      setNotes(((data ?? []) as unknown as NoteRow[]).map(rowToNote))
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
      .channel(uniqueChannelTopic(`notes-${coupleId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if (hasId(payload.old)) {
              const removed = payload.old.id
              setNotes((current) => current.filter((note) => note.id !== removed))
            }
            return
          }
          if (hasId(payload.new)) {
            const row = payload.new as unknown as NoteRow
            setNotes((current) => upsertNote(current, rowToNote(row)))
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId])

  const createNote = useCallback(
    async (input: NoteInput) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('notes')
        .insert({
          couple_id: coupleId,
          created_by: userId,
          title: input.title,
          body: input.body,
        })
        .select(NOTE_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setNotes((current) => upsertNote(current, rowToNote(data as unknown as NoteRow)))
    },
    [coupleId, userId],
  )

  const updateNote = useCallback(async (id: string, input: NoteInput) => {
    const { data, error: updateError } = await supabase
      .from('notes')
      .update({ title: input.title, body: input.body })
      .eq('id', id)
      .select(NOTE_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    setNotes((current) => upsertNote(current, rowToNote(data as unknown as NoteRow)))
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('notes').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setNotes((current) => current.filter((note) => note.id !== id))
  }, [])

  const value = useMemo(
    () => ({ notes, loading, error, refresh, createNote, updateNote, deleteNote }),
    [notes, loading, error, refresh, createNote, updateNote, deleteNote],
  )
  return value
}

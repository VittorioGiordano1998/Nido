import { useCallback, useEffect, useMemo, useState } from 'react'

import { subscribeToAppResync } from '../../core/resync'
import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { expandOccurrences, occurrenceEndMs } from './recurrence'

export type EventVisibility = 'couple' | 'private'
export type EventOccasion = 'birthday' | 'anniversary'

export interface CalendarEvent {
  id: string
  coupleId: string
  title: string
  description: string | null
  location: string | null
  startAt: string
  endAt: string | null
  allDay: boolean
  visibility: EventVisibility
  createdBy: string
  updatedAt: string
  /** iCal text (FREQ/INTERVAL/UNTIL/COUNT subset); null = single event. */
  rrule: string | null
  /** Gift radar tag; null = ordinary event. */
  occasion: EventOccasion | null
  /** Who the occasion is for. */
  occasionFor: string | null
  /** Custom reminder lead in minutes; null = default, 0 = none (TASK-CAL-…-004). */
  remindMinutes: number | null
}

export interface EventInput {
  title: string
  description: string | null
  location: string | null
  startAt: string
  endAt: string | null
  allDay: boolean
  visibility: EventVisibility
  rrule: string | null
  occasion: EventOccasion | null
  occasionFor: string | null
  remindMinutes: number | null
}

interface EventRow {
  id: string
  couple_id: string
  title: string
  description: string | null
  location: string | null
  start_at: string
  end_at: string | null
  all_day: boolean
  visibility: string
  created_by: string
  updated_at: string
  rrule: string | null
  occasion: string | null
  occasion_for: string | null
  remind_minutes: number | null
}

const EVENT_COLUMNS =
  'id, couple_id, title, description, location, start_at, end_at, all_day, visibility, created_by, updated_at, rrule, occasion, occasion_for, remind_minutes'

function rowToEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title,
    description: row.description,
    location: row.location,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day,
    visibility: row.visibility === 'private' ? 'private' : 'couple',
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    rrule: row.rrule,
    occasion:
      row.occasion === 'birthday' || row.occasion === 'anniversary' ? row.occasion : null,
    occasionFor: row.occasion_for,
    remindMinutes: row.remind_minutes,
  }
}

function sortByStart(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => a.startAt.localeCompare(b.startAt))
}

function upsert(events: CalendarEvent[], next: CalendarEvent): CalendarEvent[] {
  return sortByStart([...events.filter((event) => event.id !== next.id), next])
}

function asRow(value: Record<string, unknown>): EventRow | null {
  return typeof value.id === 'string' ? (value as unknown as EventRow) : null
}

/**
 * Eventi della coppia (state layer): caricamento, scritture e sincronizzazione
 * Realtime. Un solo canale per montaggio, chiuso allo smontaggio.
 */
export function useEvents() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setEvents([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('events')
      .select(EVENT_COLUMNS)
      .eq('couple_id', coupleId)
      .order('start_at', { ascending: true })
    if (loadError) {
      setError(loadError.message)
    } else {
      setEvents(((data ?? []) as unknown as EventRow[]).map(rowToEvent))
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
      .channel(uniqueChannelTopic(`events-${coupleId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const old = asRow(payload.old as unknown as Record<string, unknown>)
            if (old) setEvents((current) => current.filter((event) => event.id !== old.id))
            return
          }
          const row = asRow(payload.new as unknown as Record<string, unknown>)
          if (row) setEvents((current) => upsert(current, rowToEvent(row)))
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId])

  const createEvent = useCallback(
    async (input: EventInput) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          couple_id: coupleId,
          created_by: userId,
          title: input.title,
          description: input.description,
          location: input.location,
          start_at: input.startAt,
          end_at: input.endAt,
          all_day: input.allDay,
          visibility: input.visibility,
          rrule: input.rrule,
          occasion: input.occasion,
          occasion_for: input.occasionFor,
          remind_minutes: input.remindMinutes,
        })
        .select(EVENT_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setEvents((current) => upsert(current, rowToEvent(data as unknown as EventRow)))
    },
    [coupleId, userId],
  )

  const updateEvent = useCallback(async (id: string, input: EventInput) => {
    const { data, error: updateError } = await supabase
      .from('events')
      .update({
        title: input.title,
        description: input.description,
        location: input.location,
        start_at: input.startAt,
        end_at: input.endAt,
        all_day: input.allDay,
        visibility: input.visibility,
        rrule: input.rrule,
        occasion: input.occasion,
        occasion_for: input.occasionFor,
        remind_minutes: input.remindMinutes,
      })
      .eq('id', id)
      .select(EVENT_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    setEvents((current) => upsert(current, rowToEvent(data as unknown as EventRow)))
  }, [])

  const deleteEvent = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('events').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setEvents((current) => current.filter((event) => event.id !== id))
  }, [])

  /** Re-inserts a deleted event (undo toast, TASK-UI-…-001). */
  const restoreEvent = useCallback(async (event: CalendarEvent) => {
    const { data, error: insertError } = await supabase
      .from('events')
      .insert({
        id: event.id,
        couple_id: event.coupleId,
        created_by: event.createdBy,
        title: event.title,
        description: event.description,
        location: event.location,
        start_at: event.startAt,
        end_at: event.endAt,
        all_day: event.allDay,
        visibility: event.visibility,
        rrule: event.rrule,
        occasion: event.occasion,
        occasion_for: event.occasionFor,
        remind_minutes: event.remindMinutes,
      })
      .select(EVENT_COLUMNS)
      .single()
    if (insertError) throw new Error(insertError.message)
    setEvents((current) => upsert(current, rowToEvent(data as unknown as EventRow)))
  }, [])

  const value = useMemo(
    () => ({ events, loading, error, refresh, createEvent, updateEvent, deleteEvent, restoreEvent }),
    [events, loading, error, refresh, createEvent, updateEvent, deleteEvent, restoreEvent],
  )
  return value
}

/** I prossimi eventi (occorrenze ricorrenti incluse), già ordinati: per Home. */
export function useUpcomingEvents(limit = 3) {
  const data = useEvents()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const upcoming = useMemo(() => {
    const current = new Date(now)
    const horizon = new Date(now + 90 * 24 * 60 * 60 * 1000)
    return expandOccurrences(data.events, current, horizon)
      .filter((occurrence) => occurrenceEndMs(occurrence) >= now)
      .slice(0, limit)
  }, [data.events, limit, now])
  return { ...data, upcoming }
}

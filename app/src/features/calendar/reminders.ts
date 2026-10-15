import { useEffect, useRef, useState } from 'react'

import { formatTimeIt } from '../../core/dates'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { expandOccurrences } from './recurrence'
import type { EventOccurrence } from './recurrence'
import type { CalendarEvent } from './useEvents'
import { useEvents } from './useEvents'

/**
 * Calendar reminders on two channels.
 *
 * While the app is open a local Notification fires (Notification API). With
 * the app closed the delivery is server-side: this module materializes the
 * next days of occurrences into `push_reminders`, and the pg_cron job
 * `nido-push-reminders` calls the Edge Function send-reminders
 * (TASK-CAL-VITTORIOGIORDANOYBQ-003). Both use the same lead time and the
 * same body, so they read as one feature.
 */

/** How long before the start the notification fires. */
const LEAD_MINUTES = 15
/** All-day events remind at this hour of their own day. */
const ALL_DAY_HOUR = 9
/** Local timers are (re)scheduled for this horizon, then refreshed. */
const HORIZON_MINUTES = 31
const RESCHEDULE_MS = 5 * 60 * 1000
/** Server-side reminders are materialized this far ahead, then refreshed. */
const PUSH_HORIZON_DAYS = 7

export function reminderAtMs(occurrence: EventOccurrence): number {
  const start = new Date(occurrence.startAt)
  if (occurrence.event.allDay) {
    return new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      ALL_DAY_HOUR,
      0,
      0,
    ).getTime()
  }
  return start.getTime() - LEAD_MINUTES * 60 * 1000
}

function notificationBody(occurrence: EventOccurrence): string {
  const parts: string[] = [
    occurrence.event.allDay ? 'Tutto il giorno' : `Alle ${formatTimeIt(occurrence.startAt)}`,
  ]
  if (occurrence.event.location) parts.push(occurrence.event.location)
  if (occurrence.recurring) parts.push('Si ripete')
  return parts.join(' · ')
}

function notificationsSupported(): boolean {
  return typeof Notification !== 'undefined'
}

/**
 * Replaces the couple's unsent future rows with the current expansion: both
 * devices refresh, the last one wins (fine for private use). Sent rows and the
 * partner's private ones are out of reach of the table's policies; deleted
 * events cascade.
 */
async function materializePushReminders(
  coupleId: string,
  userId: string,
  events: CalendarEvent[],
): Promise<void> {
  const now = Date.now()
  const dayStart = new Date(now)
  dayStart.setHours(0, 0, 0, 0)
  const horizonEnd = new Date(now + PUSH_HORIZON_DAYS * 24 * 60 * 60 * 1000)

  const rows = expandOccurrences(events, dayStart, horizonEnd)
    .filter((occurrence) => {
      const at = reminderAtMs(occurrence)
      return at > now && at <= horizonEnd.getTime()
    })
    .map((occurrence) => ({
      couple_id: coupleId,
      event_id: occurrence.event.id,
      occurrence_key: occurrence.key,
      fire_at: new Date(reminderAtMs(occurrence)).toISOString(),
      only_for: occurrence.event.visibility === 'private' ? occurrence.event.createdBy : null,
      created_by: userId,
      title: occurrence.event.title,
      body: notificationBody(occurrence),
    }))

  const { error: clearError } = await supabase
    .from('push_reminders')
    .delete()
    .eq('couple_id', coupleId)
    .is('sent_at', null)
    .gt('fire_at', new Date(now).toISOString())
  if (clearError) throw new Error(clearError.message)

  if (rows.length === 0) return
  const { error: upsertError } = await supabase
    .from('push_reminders')
    .upsert(rows, { onConflict: 'event_id,occurrence_key' })
  if (upsertError) throw new Error(upsertError.message)
}

/** Mounted by the shell: fires local reminders while open and materializes the
 * server-side ones. */
export function useEventReminders(enabled: boolean): void {
  const { events, loading, error } = useEvents()
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null
  const fired = useRef(new Set<string>())
  const [tick, setTick] = useState(0)
  const chain = useRef(Promise.resolve())

  // Materialization does not depend on the local-reminder switch: it is what
  // lets the couple's subscribed devices receive reminders with the app
  // closed. The push subscription stays the per-device delivery gate.
  useEffect(() => {
    if (!coupleId || !userId || loading || error) return
    chain.current = chain.current
      .then(() => materializePushReminders(coupleId, userId, events))
      .catch(() => {})
  }, [coupleId, userId, loading, error, events])

  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => setTick((value) => value + 1), RESCHEDULE_MS)
    return () => window.clearInterval(timer)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    if (!notificationsSupported() || Notification.permission !== 'granted') return

    const now = Date.now()
    const horizon = now + HORIZON_MINUTES * 60 * 1000
    const occurrences = expandOccurrences(
      events,
      new Date(now),
      new Date(horizon + 24 * 60 * 60 * 1000),
    )

    const timers: number[] = []
    for (const occurrence of occurrences) {
      const at = reminderAtMs(occurrence)
      if (at < now || at > horizon) continue
      if (fired.current.has(occurrence.key)) continue
      timers.push(
        window.setTimeout(() => {
          fired.current.add(occurrence.key)
          new Notification(occurrence.event.title, {
            body: notificationBody(occurrence),
            tag: occurrence.key,
          })
        }, at - now),
      )
    }
    return () => {
      for (const timer of timers) window.clearTimeout(timer)
    }
  }, [enabled, events, tick])
}

import { useEffect, useRef, useState } from 'react'

import { formatTimeIt } from '../../core/dates'
import { expandOccurrences } from './recurrence'
import type { EventOccurrence } from './recurrence'
import { useEvents } from './useEvents'

/**
 * Local reminders while the app is open (Notification API). The web platform
 * cannot schedule a notification with the browser closed: that gap closes
 * with push (TASK-PUSH-VITTORIOGIORDANOYBQ-001).
 */

/** How long before the start the notification fires. */
const LEAD_MINUTES = 15
/** All-day events remind at this hour of their own day. */
const ALL_DAY_HOUR = 9
/** Timers are (re)scheduled for this horizon, then refreshed. */
const HORIZON_MINUTES = 31
const RESCHEDULE_MS = 5 * 60 * 1000

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

/** Mounted by the shell: fires reminders for occurrences due within the horizon. */
export function useEventReminders(enabled: boolean): void {
  const { events } = useEvents()
  const fired = useRef(new Set<string>())
  const [tick, setTick] = useState(0)

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

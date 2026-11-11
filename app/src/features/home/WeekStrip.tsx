import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { formatDateIt, toDateKey, weekDays } from '../../core/dates'
import { expandOccurrences } from '../calendar/recurrence'
import type { CalendarEvent } from '../calendar/useEvents'

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const

interface WeekStripProps {
  events: CalendarEvent[]
  myId: string | undefined
}

/**
 * The current week at a glance: seven days, a dot per event (mine in accent,
 * the partner's in sage). A tap opens the calendar on that day.
 */
export function WeekStrip({ events, myId }: WeekStripProps) {
  const [days] = useState(() => weekDays())
  const [todayKey] = useState(() => toDateKey(new Date()))

  const byDay = useMemo(() => {
    const first = days[0]
    const last = days[days.length - 1]
    const map = new Map<string, CalendarEvent[]>()
    if (!first || !last) return map
    const windowEnd = new Date(
      last.date.getFullYear(),
      last.date.getMonth(),
      last.date.getDate(),
      23,
      59,
      59,
    )
    for (const occurrence of expandOccurrences(events, first.date, windowEnd)) {
      const key = toDateKey(new Date(occurrence.startAt))
      const list = map.get(key) ?? []
      list.push(occurrence.event)
      map.set(key, list)
    }
    return map
  }, [days, events])

  return (
    <div className="grid grid-cols-7 gap-1 rounded-3xl bg-surface p-2 shadow-card ring-1 ring-line/60">
      {days.map((day, index) => {
        const dayEvents = byDay.get(day.key) ?? []
        const isToday = day.key === todayKey
        const isPast = day.key < todayKey
        return (
          <Link
            key={day.key}
            to="/calendar"
            state={{ dateKey: day.key }}
            viewTransition
            aria-label={`${formatDateIt(day.key)}${
              dayEvents.length > 0 ? `, ${dayEvents.length} eventi` : ''
            }`}
            aria-current={isToday ? 'date' : undefined}
            className={`flex flex-col items-center gap-1 rounded-2xl py-2 transition ${
              isToday
                ? 'bg-gradient-to-b from-accent-500 to-accent-700 text-white shadow-md shadow-accent-600/25'
                : 'hover:bg-surface-muted'
            }`}
          >
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${
                isToday ? 'text-white/85' : 'text-ink-faint'
              }`}
            >
              {WEEKDAY_LABELS[index]}
            </span>
            <span
              className={`font-display text-lg font-semibold leading-none tabular-nums ${
                isToday ? '' : isPast ? 'text-ink-faint' : 'text-ink'
              }`}
            >
              {day.date.getDate()}
            </span>
            <span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">
              {dayEvents.slice(0, 3).map((event, dotIndex) => (
                <span
                  key={`${event.id}-${dotIndex}`}
                  className={`h-1.5 w-1.5 rounded-full ${
                    isToday ? 'bg-white' : event.createdBy === myId ? 'bg-accent-500' : 'bg-sage-500'
                  }`}
                />
              ))}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

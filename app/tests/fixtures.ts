import type { EventOccurrence } from '../src/features/calendar/recurrence'
import type { CalendarEvent } from '../src/features/calendar/useEvents'

/** Shared fixtures: a couple event with sane defaults, overridable per test. */
export function makeEvent(partial: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'event-1',
    coupleId: 'couple-1',
    title: 'Evento',
    description: null,
    location: null,
    startAt: new Date(2026, 9, 16, 15, 30).toISOString(),
    endAt: null,
    allDay: false,
    visibility: 'couple',
    createdBy: 'user-1',
    updatedAt: new Date(2026, 9, 1).toISOString(),
    rrule: null,
    occasion: null,
    occasionFor: null,
    remindMinutes: null,
    ...partial,
  }
}

export function makeOccurrence(partial: Partial<CalendarEvent> = {}): EventOccurrence {
  const event = makeEvent(partial)
  return {
    key: `${event.id}:${event.startAt}`,
    event,
    startAt: event.startAt,
    endAt: null,
    recurring: event.rrule !== null,
  }
}

import { useMemo, useState } from 'react'

import {
  addMonths,
  formatDateIt,
  formatMonthYearIt,
  formatTimeIt,
  monthCells,
  startOfMonth,
  toDateKey,
} from '../../core/dates'
import { Card, EmptyState, ErrorBanner, Spinner } from '../../ui/components'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
  PlusIcon,
} from '../../ui/icons'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { EventEditor } from './EventEditor'
import { useEvents } from './useEvents'
import type { CalendarEvent, EventInput } from './useEvents'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const

function timeLabel(event: CalendarEvent): string {
  if (event.allDay) return 'Tutto il giorno'
  const start = formatTimeIt(event.startAt)
  return event.endAt ? `${start} – ${formatTimeIt(event.endAt)}` : start
}

export function CalendarPage() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const { events, loading, error, createEvent, updateEvent, deleteEvent } = useEvents()

  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(new Date()))
  const [editor, setEditor] = useState<{ event: CalendarEvent | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const myId = session?.user.id
  const [todayKey] = useState(() => toDateKey(new Date()))
  const cells = useMemo(() => monthCells(month), [month])

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events) {
      const key = toDateKey(new Date(event.startAt))
      const list = map.get(key)
      if (list) list.push(event)
      else map.set(key, [event])
    }
    return map
  }, [events])

  const selectedEvents = byDay.get(selectedKey) ?? []
  const hasCouple = couple !== null

  function openNew() {
    setFormError(null)
    setEditor({ event: null })
  }

  function openEdit(event: CalendarEvent) {
    setFormError(null)
    setEditor({ event })
  }

  function closeEditor() {
    setEditor(null)
    setFormError(null)
  }

  function goToday() {
    const now = new Date()
    setMonth(startOfMonth(now))
    setSelectedKey(toDateKey(now))
  }

  async function handleSave(input: EventInput) {
    if (!editor) return
    setSaving(true)
    setFormError(null)
    try {
      if (editor.event) await updateEvent(editor.event.id, input)
      else await createEvent(input)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setSaving(true)
    setFormError(null)
    try {
      await deleteEvent(id)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-stone-900">Calendario</h1>
          <p className="text-sm text-stone-500">
            Gli appuntamenti della coppia, con quelli che restano solo tuoi.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          disabled={!hasCouple}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-clay-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-clay-300"
        >
          <PlusIcon className="h-4 w-4" /> Evento
        </button>
      </header>

      {error && <ErrorBanner message={error} />}

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Mese precedente"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold capitalize text-stone-800">
              {formatMonthYearIt(month)}
            </h2>
            <button
              type="button"
              onClick={goToday}
              className="rounded-full bg-clay-100 px-2.5 py-1 text-[11px] font-semibold text-clay-700 transition hover:bg-clay-200"
            >
              Oggi
            </button>
          </div>
          <button
            type="button"
            aria-label="Mese successivo"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((cell) => {
            const dayEvents = byDay.get(cell.key) ?? []
            const isSelected = cell.key === selectedKey
            const isToday = cell.key === todayKey
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedKey(cell.key)}
                aria-label={formatDateIt(cell.key)}
                aria-pressed={isSelected}
                className={`flex flex-col items-center rounded-xl py-1.5 text-sm font-medium transition ${
                  isSelected
                    ? 'bg-clay-600 text-white'
                    : isToday
                      ? 'bg-clay-100 text-clay-800 hover:bg-clay-200'
                      : cell.inMonth
                        ? 'text-stone-700 hover:bg-stone-100'
                        : 'text-stone-300 hover:bg-stone-50'
                }`}
              >
                <span>{cell.date.getDate()}</span>
                <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span
                      key={event.id}
                      className={`h-1 w-1 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : event.createdBy === myId
                            ? 'bg-clay-500'
                            : 'bg-sage-500'
                      }`}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          {formatDateIt(selectedKey)}
        </h2>

        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : selectedEvents.length === 0 ? (
          <EmptyState
            title="Nessun evento"
            description={
              hasCouple
                ? 'Giorno libero: tocca "Evento" per aggiungere qualcosa.'
                : 'Crea la coppia per iniziare a riempire il calendario.'
            }
          />
        ) : (
          <ul className="space-y-2">
            {selectedEvents.map((event) => (
              <li key={event.id}>
                <button type="button" onClick={() => openEdit(event)} className="w-full">
                  <Card className="flex w-full items-center gap-3 text-left transition hover:ring-clay-300">
                    <span
                      className={`h-9 w-1.5 shrink-0 rounded-full ${
                        event.createdBy === myId ? 'bg-clay-400' : 'bg-sage-500'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-stone-800">
                          {event.title}
                        </span>
                        {event.visibility === 'private' && (
                          <LockIcon className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        )}
                      </span>
                      <span className="block text-xs text-stone-500">
                        {timeLabel(event)}
                        {event.location ? ` · ${event.location}` : ''}
                        {event.createdBy !== myId ? ' · del partner' : ''}
                      </span>
                    </span>
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editor && (
        <EventEditor
          key={editor.event?.id ?? 'new'}
          event={editor.event}
          defaultDateKey={selectedKey}
          saving={saving}
          error={formError}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closeEditor}
        />
      )}
    </div>
  )
}

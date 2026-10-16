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
import { Card, EmptyState, ErrorBanner } from '../../ui/components'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LockIcon,
  PlusIcon,
} from '../../ui/icons'
import { CardListSkeleton } from '../../ui/Skeleton'
import { useToast } from '../../ui/toast'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { periodDayKeys, periodLabel, useCycleCalendar } from '../cycle/useCycleCalendar'
import { EventEditor } from './EventEditor'
import { expandOccurrences } from './recurrence'
import type { EventOccurrence } from './recurrence'
import { useEvents } from './useEvents'
import type { CalendarEvent, EventInput } from './useEvents'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const

function occurrenceLabel(occurrence: EventOccurrence): string {
  if (occurrence.event.allDay) return 'Tutto il giorno'
  const start = formatTimeIt(occurrence.startAt)
  return occurrence.endAt ? `${start} – ${formatTimeIt(occurrence.endAt)}` : start
}

function occasionLabel(event: CalendarEvent): string {
  if (event.occasion === 'birthday') return ' · compleanno'
  if (event.occasion === 'anniversary') return ' · anniversario'
  return ''
}

export function CalendarPage() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const { events, loading, error, createEvent, updateEvent, deleteEvent, restoreEvent } =
    useEvents()
  const { periods, loading: cycleLoading, error: cycleError } = useCycleCalendar()
  const { showToast } = useToast()

  const [month, setMonth] = useState(() => startOfMonth(new Date()))
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(new Date()))
  const [editor, setEditor] = useState<{ event: CalendarEvent | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const myId = session?.user.id
  const [todayKey] = useState(() => toDateKey(new Date()))
  const cells = useMemo(() => monthCells(month), [month])

  const occurrences = useMemo(() => {
    const first = cells[0]?.date ?? month
    const last = cells[cells.length - 1]?.date ?? month
    return expandOccurrences(
      events,
      first,
      new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
    )
  }, [cells, events, month])

  const byDay = useMemo(() => {
    const map = new Map<string, EventOccurrence[]>()
    for (const occurrence of occurrences) {
      const key = toDateKey(new Date(occurrence.startAt))
      const list = map.get(key)
      if (list) list.push(occurrence)
      else map.set(key, [occurrence])
    }
    return map
  }, [occurrences])

  const onDayCycle = useMemo(() => {
    const map = new Map<string, (typeof periods)[number][]>()
    for (const period of periods) {
      for (const key of periodDayKeys(period)) {
        const list = map.get(key)
        if (list) list.push(period)
        else map.set(key, [period])
      }
    }
    return map
  }, [periods])

  const selectedOccurrences = byDay.get(selectedKey) ?? []
  const selectedCycle = onDayCycle.get(selectedKey) ?? []
  const hasCouple = couple !== null

  function nameOf(userId: string): string {
    return couple?.members.find((member) => member.userId === userId)?.displayName ?? '—'
  }

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
    const deleted = events.find((event) => event.id === id) ?? null
    setSaving(true)
    setFormError(null)
    try {
      await deleteEvent(id)
      setEditor(null)
      if (deleted) {
        showToast({
          message: 'Evento eliminato.',
          action: { label: 'Annulla', onAction: () => void restoreEvent(deleted) },
        })
      }
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
          <h1 className="text-balance text-2xl font-bold text-ink">Calendario</h1>
          <p className="text-sm text-ink-muted">
            Gli appuntamenti della coppia, con quelli che restano solo tuoi.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          disabled={!hasCouple}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-accent-300"
        >
          <PlusIcon className="h-4 w-4" /> Evento
        </button>
      </header>

      {error && <ErrorBanner message={error} />}
      {cycleError && <ErrorBanner message={cycleError} />}

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Mese precedente"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft hover:text-ink"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold capitalize text-ink">
              {formatMonthYearIt(month)}
            </h2>
            <button
              type="button"
              onClick={goToday}
              className="rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-semibold text-accent-ink transition hover:bg-accent-200"
            >
              Oggi
            </button>
          </div>
          <button
            type="button"
            aria-label="Mese successivo"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft hover:text-ink"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
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
                    ? 'bg-accent-600 text-white'
                    : isToday
                      ? 'bg-accent-100 text-accent-ink hover:bg-accent-200'
                      : cell.inMonth
                        ? 'text-ink-soft hover:bg-surface-soft'
                        : 'text-ink-faint hover:bg-surface-soft'
                }`}
              >
                <span className="tabular-nums">{cell.date.getDate()}</span>
                <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                  {dayEvents.slice(0, 3).map((occurrence) => (
                    <span
                      key={occurrence.key}
                      className={`h-1 w-1 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : occurrence.event.createdBy === myId
                            ? 'bg-accent-500'
                            : 'bg-sage-500'
                      }`}
                    />
                  ))}
                  {(onDayCycle.get(cell.key)?.length ?? 0) > 0 && (
                    <span
                      aria-hidden="true"
                      className={`h-1 w-1 rounded-full ${isSelected ? 'bg-rose-200' : 'bg-rose-400'}`}
                    />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          {formatDateIt(selectedKey)}
        </h2>

        {loading || cycleLoading ? (
          <CardListSkeleton rows={2} />
        ) : selectedOccurrences.length === 0 && selectedCycle.length === 0 ? (
          <EmptyState
            title="Nessun evento"
            description={
              hasCouple
                ? 'Giorno libero: tocca "Evento" per aggiungere qualcosa.'
                : 'Crea la coppia per iniziare a riempire il calendario.'
            }
          />
        ) : (
          <div className="space-y-2">
            {selectedCycle.length > 0 && (
              <ul className="space-y-2">
                {selectedCycle.map((period) => (
                  <li key={period.id}>
                    <Card className="flex items-center gap-3">
                      <span className="h-9 w-1.5 shrink-0 rounded-full bg-rose-400" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">
                          {period.userId === myId
                            ? 'Il tuo ciclo'
                            : `Ciclo di ${nameOf(period.userId)}`}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          {periodLabel(period)} · date condivise
                        </span>
                      </span>
                    </Card>
                  </li>
                ))}
              </ul>
            )}

            {selectedOccurrences.length === 0 ? (
              <p className="px-1 text-xs text-ink-faint">Nessun evento per questo giorno.</p>
            ) : (
              <ul className="space-y-2">
                {selectedOccurrences.map((occurrence) => (
                  <li key={occurrence.key}>
                    <button
                      type="button"
                      onClick={() => openEdit(occurrence.event)}
                      className="w-full"
                    >
                      <Card className="flex w-full items-center gap-3 text-left transition hover:ring-accent-300">
                        <span
                          className={`h-9 w-1.5 shrink-0 rounded-full ${
                            occurrence.event.createdBy === myId ? 'bg-accent-400' : 'bg-sage-500'
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-ink">
                              {occurrence.event.title}
                            </span>
                            {occurrence.event.visibility === 'private' && (
                              <LockIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                            )}
                          </span>
                          <span className="block text-xs text-ink-muted">
                            {occurrenceLabel(occurrence)}
                            {occurrence.event.location ? ` · ${occurrence.event.location}` : ''}
                            {occurrence.recurring ? ' · si ripete' : ''}
                            {occasionLabel(occurrence.event)}
                            {occurrence.event.createdBy !== myId ? ' · del partner' : ''}
                          </span>
                        </span>
                      </Card>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {editor && (
        <EventEditor
          key={editor.event?.id ?? 'new'}
          event={editor.event}
          defaultDateKey={selectedKey}
          members={(couple?.members ?? []).map((member) => ({
            userId: member.userId,
            displayName: member.displayName,
          }))}
          myId={myId ?? null}
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

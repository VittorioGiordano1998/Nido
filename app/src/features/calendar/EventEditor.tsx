import { useEffect, useState } from 'react'

import { toDateKey, toTimeInput } from '../../core/dates'
import { Button, ErrorBanner, Field, TextArea, TextInput } from '../../ui/components'
import { CloseIcon, LockIcon, TrashIcon } from '../../ui/icons'
import type { CalendarEvent, EventInput, EventVisibility } from './useEvents'

interface EventEditorProps {
  /** Evento in modifica; `null` = nuovo evento. */
  event: CalendarEvent | null
  /** Giorno selezionato nel calendario, default per un nuovo evento. */
  defaultDateKey: string
  saving: boolean
  error: string | null
  onSave: (input: EventInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

interface FormState {
  title: string
  allDay: boolean
  dateKey: string
  startTime: string
  endTime: string
  location: string
  description: string
  visibility: EventVisibility
}

function isoFromParts(dateKey: string, time: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).toISOString()
}

function initialState(event: CalendarEvent | null, defaultDateKey: string): FormState {
  if (!event) {
    return {
      title: '',
      allDay: false,
      dateKey: defaultDateKey,
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      description: '',
      visibility: 'couple',
    }
  }
  return {
    title: event.title,
    allDay: event.allDay,
    dateKey: toDateKey(new Date(event.startAt)),
    startTime: event.allDay ? '09:00' : toTimeInput(event.startAt),
    endTime: event.endAt && !event.allDay ? toTimeInput(event.endAt) : '10:00',
    location: event.location ?? '',
    description: event.description ?? '',
    visibility: event.visibility,
  }
}

export function EventEditor({
  event,
  defaultDateKey,
  saving,
  error,
  onSave,
  onDelete,
  onClose,
}: EventEditorProps) {
  const [form, setForm] = useState<FormState>(() => initialState(event, defaultDateKey))
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit() {
    const title = form.title.trim()
    if (!title) {
      setValidationError('Serve un titolo.')
      return
    }
    if (!form.dateKey) {
      setValidationError('Serve una data.')
      return
    }

    let startAt: string
    let endAt: string | null = null
    if (form.allDay) {
      startAt = isoFromParts(form.dateKey, '00:00')
    } else {
      if (!form.startTime) {
        setValidationError("Serve un orario di inizio.")
        return
      }
      startAt = isoFromParts(form.dateKey, form.startTime)
      if (form.endTime) {
        endAt = isoFromParts(form.dateKey, form.endTime)
        if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
          setValidationError("La fine deve essere dopo l'inizio.")
          return
        }
      }
    }

    setValidationError(null)
    await onSave({
      title,
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      startAt,
      endAt,
      allDay: form.allDay,
      visibility: form.visibility,
    })
  }

  function handleDelete() {
    if (!event) return
    if (!window.confirm('Eliminare questo evento?')) return
    void onDelete(event.id)
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-end justify-center bg-scrim backdrop-blur-[2px] sm:items-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event ? 'Modifica evento' : 'Nuovo evento'}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            {event ? 'Modifica evento' : 'Nuovo evento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink-soft"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4">
          <Field label="Titolo">
            <TextInput
              value={form.title}
              onChange={(changeEvent) => setForm({ ...form, title: changeEvent.target.value })}
              placeholder="Es. Cena dai miei"
              autoFocus
            />
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 ring-1 ring-line">
            <span className="text-sm font-semibold text-ink-soft">Tutto il giorno</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.allDay}
              aria-label="Evento tutto il giorno"
              onClick={() => setForm({ ...form, allDay: !form.allDay })}
              className={`h-6 w-11 shrink-0 rounded-full transition ${
                form.allDay ? 'bg-accent-600' : 'bg-line-strong'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition ${
                  form.allDay ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <Field label="Data">
            <TextInput
              type="date"
              value={form.dateKey}
              onChange={(changeEvent) => setForm({ ...form, dateKey: changeEvent.target.value })}
            />
          </Field>

          {!form.allDay && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inizio">
                <TextInput
                  type="time"
                  value={form.startTime}
                  onChange={(changeEvent) =>
                    setForm({ ...form, startTime: changeEvent.target.value })
                  }
                />
              </Field>
              <Field label="Fine">
                <TextInput
                  type="time"
                  value={form.endTime}
                  onChange={(changeEvent) =>
                    setForm({ ...form, endTime: changeEvent.target.value })
                  }
                />
              </Field>
            </div>
          )}

          <Field label="Luogo">
            <TextInput
              value={form.location}
              onChange={(changeEvent) => setForm({ ...form, location: changeEvent.target.value })}
              placeholder="Facoltativo"
            />
          </Field>

          <Field label="Note">
            <TextArea
              rows={3}
              value={form.description}
              onChange={(changeEvent) =>
                setForm({ ...form, description: changeEvent.target.value })
              }
              placeholder="Facoltativo"
            />
          </Field>

          <Field label="Visibilità" hint="Un evento privato non è visibile al partner.">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, visibility: 'couple' })}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${
                  form.visibility === 'couple'
                    ? 'bg-accent-600 text-white ring-accent-600'
                    : 'bg-surface text-ink-soft ring-line hover:bg-surface-soft'
                }`}
              >
                Coppia
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, visibility: 'private' })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${
                  form.visibility === 'private'
                    ? 'bg-accent-600 text-white ring-accent-600'
                    : 'bg-surface text-ink-soft ring-line hover:bg-surface-soft'
                }`}
              >
                <LockIcon className="h-4 w-4" /> Privato
              </button>
            </div>
          </Field>

          {validationError && <ErrorBanner message={validationError} />}
          {error && <ErrorBanner message={error} />}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              loading={saving}
              onClick={() => void handleSubmit()}
              className="flex-1"
            >
              {event ? 'Salva modifiche' : 'Crea evento'}
            </Button>
            {event && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={saving}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
              >
                <TrashIcon className="h-4 w-4" /> Elimina
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

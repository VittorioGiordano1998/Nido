import { useEffect, useState } from 'react'

import { formatDateIt } from '../../core/dates'
import { Button, ErrorBanner, Field, Select, TextArea } from '../../ui/components'
import { CloseIcon, TrashIcon } from '../../ui/icons'
import { MAX_PERIOD_DAYS } from './useCycle'
import type { CycleLog, CycleLogInput } from './useCycle'

export const SYMPTOMS = [
  'dolori',
  'mal di testa',
  'stanchezza',
  'gonfiore',
  'nausea',
  'sonno leggero',
  'pelle',
  'umore altalenante',
] as const

interface CycleLogEditorProps {
  dateKey: string
  log: CycleLog | null
  saving: boolean
  error: string | null
  onSave: (input: CycleLogInput, days: number) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

export function CycleLogEditor({
  dateKey,
  log,
  saving,
  error,
  onSave,
  onDelete,
  onClose,
}: CycleLogEditorProps) {
  const [flow, setFlow] = useState(log?.flow ? String(log.flow) : '')
  const [mood, setMood] = useState(log?.mood ? String(log.mood) : '')
  const [symptoms, setSymptoms] = useState<string[]>(log?.symptoms ?? [])
  const [notes, setNotes] = useState(log?.notes ?? '')
  const [days, setDays] = useState('1')

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function toggleSymptom(symptom: string) {
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((entry) => entry !== symptom)
        : [...current, symptom],
    )
  }

  async function handleSubmit() {
    await onSave(
      {
        flow: flow ? Number(flow) : null,
        mood: mood ? Number(mood) : null,
        symptoms,
        notes: notes.trim() || null,
      },
      flow ? Number(days) : 1,
    )
  }

  function handleDelete() {
    if (!log) return
    if (!window.confirm('Eliminare il segno di questo giorno?')) return
    void onDelete(log.id)
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
        aria-label="Diario del ciclo"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Diario del {formatDateIt(dateKey)}</h2>
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
          <Field label="Flusso">
            <Select value={flow} onChange={(changeEvent) => setFlow(changeEvent.target.value)}>
              <option value="">Nessuno</option>
              <option value="1">1 · Leggero</option>
              <option value="2">2</option>
              <option value="3">3 · Medio</option>
              <option value="4">4</option>
              <option value="5">5 · Abbondante</option>
            </Select>
          </Field>

          {flow && (
            <Field
              label="Durata"
              hint="Segna il flusso anche nei giorni successivi, dove non hai già scritto nulla."
            >
              <Select value={days} onChange={(changeEvent) => setDays(changeEvent.target.value)}>
                {Array.from({ length: MAX_PERIOD_DAYS }, (_, index) => (
                  <option key={index + 1} value={String(index + 1)}>
                    {index === 0 ? 'Solo questo giorno' : `${index + 1} giorni`}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Umore">
            <Select value={mood} onChange={(changeEvent) => setMood(changeEvent.target.value)}>
              <option value="">—</option>
              <option value="1">1 · Giù</option>
              <option value="2">2</option>
              <option value="3">3 · Neutro</option>
              <option value="4">4</option>
              <option value="5">5 · Su</option>
            </Select>
          </Field>

          <Field label="Sintomi" hint="Tocca per selezionare.">
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((symptom) => {
                const active = symptoms.includes(symptom)
                return (
                  <button
                    key={symptom}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleSymptom(symptom)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? 'bg-accent-600 text-white'
                        : 'bg-surface-soft text-ink-soft hover:bg-surface-muted'
                    }`}
                  >
                    {symptom}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Note" hint="Facoltative.">
            <TextArea
              rows={2}
              value={notes}
              onChange={(changeEvent) => setNotes(changeEvent.target.value)}
            />
          </Field>

          {error && <ErrorBanner message={error} />}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              loading={saving}
              onClick={() => void handleSubmit()}
              className="flex-1"
            >
              {log ? 'Salva' : 'Aggiungi'}
            </Button>
            {log && (
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

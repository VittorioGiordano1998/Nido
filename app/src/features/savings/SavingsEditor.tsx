import { useEffect, useState } from 'react'

import { Button, ErrorBanner, Field, Select, TextInput } from '../../ui/components'
import { CloseIcon, TrashIcon } from '../../ui/icons'
import type { SavingsInput, SavingsProject } from './useSavings'

interface SavingsEditorProps {
  project: SavingsProject | null
  saving: boolean
  error: string | null
  onSave: (input: SavingsInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

const CURRENCIES = ['EUR', 'USD', 'GBP'] as const

function parseAmount(value: string): number {
  return Number(value.replace(',', '.'))
}

export function SavingsEditor({
  project,
  saving,
  error,
  onSave,
  onDelete,
  onClose,
}: SavingsEditorProps) {
  const [title, setTitle] = useState(project?.title ?? '')
  const [target, setTarget] = useState(project ? String(project.targetAmount) : '')
  const [current, setCurrent] = useState(project ? String(project.currentAmount) : '')
  const [currency, setCurrency] = useState(project?.currency ?? 'EUR')
  const [deadline, setDeadline] = useState(project?.deadline ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit() {
    if (!title.trim()) {
      setValidationError('Serve un titolo.')
      return
    }
    const targetAmount = parseAmount(target)
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setValidationError("L'obiettivo deve essere un numero maggiore di zero.")
      return
    }
    const currentAmount = current.trim() === '' ? 0 : parseAmount(current)
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      setValidationError('Il messo da parte non è valido.')
      return
    }
    setValidationError(null)
    await onSave({
      title: title.trim(),
      targetAmount,
      currentAmount,
      currency,
      deadline: deadline || null,
    })
  }

  function handleDelete() {
    if (!project) return
    if (!window.confirm('Eliminare questo progetto?')) return
    void onDelete(project.id)
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
        aria-label={project ? 'Modifica progetto' : 'Nuovo progetto'}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            {project ? 'Modifica progetto' : 'Nuovo progetto'}
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
          <Field label="Cosa mettete da parte">
            <TextInput
              value={title}
              onChange={(changeEvent) => setTitle(changeEvent.target.value)}
              placeholder="Es. Viaggio in Giappone"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Obiettivo">
              <TextInput
                inputMode="decimal"
                value={target}
                onChange={(changeEvent) => setTarget(changeEvent.target.value)}
                placeholder="Es. 1500"
              />
            </Field>
            <Field label="Valuta">
              <Select
                value={currency}
                onChange={(changeEvent) => setCurrency(changeEvent.target.value)}
              >
                {CURRENCIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Già messo da parte" hint="Facoltativo; si può aggiornare quando volete.">
            <TextInput
              inputMode="decimal"
              value={current}
              onChange={(changeEvent) => setCurrent(changeEvent.target.value)}
              placeholder="0"
            />
          </Field>

          <Field label="Entro quando" hint="Facoltativo.">
            <TextInput
              type="date"
              value={deadline}
              onChange={(changeEvent) => setDeadline(changeEvent.target.value)}
            />
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
              {project ? 'Salva' : 'Crea progetto'}
            </Button>
            {project && (
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

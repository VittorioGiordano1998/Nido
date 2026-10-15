import { useEffect, useState } from 'react'

import { Button, ErrorBanner, Field, TextInput } from '../../ui/components'
import { CloseIcon, PlusIcon, TrashIcon } from '../../ui/icons'

interface DecisionEditorProps {
  saving: boolean
  error: string | null
  onSave: (question: string, options: string[]) => Promise<void>
  onClose: () => void
}

const MAX_OPTIONS = 4

export function DecisionEditor({ saving, error, onSave, onClose }: DecisionEditorProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function setOption(index: number, value: string) {
    setOptions((current) => current.map((option, i) => (i === index ? value : option)))
  }

  function removeOption(index: number) {
    setOptions((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    const filled = options.map((option) => option.trim()).filter(Boolean)
    if (!question.trim()) {
      setValidationError('Serve una domanda.')
      return
    }
    if (filled.length < 2) {
      setValidationError('Servono almeno due opzioni.')
      return
    }
    if (new Set(filled.map((option) => option.toLowerCase())).size !== filled.length) {
      setValidationError('Le opzioni devono essere diverse tra loro.')
      return
    }
    setValidationError(null)
    await onSave(question.trim(), filled)
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
        aria-label="Nuova decisione"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Nuova decisione</h2>
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
          <Field label="Domanda" hint="Es. «Cosa mangiamo stasera?»">
            <TextInput
              value={question}
              onChange={(changeEvent) => setQuestion(changeEvent.target.value)}
              placeholder="Cosa decidiamo?"
              autoFocus
            />
          </Field>

          <Field label="Opzioni" hint="Da due a quattro; ognuno vota di nascosto.">
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <TextInput
                    value={option}
                    onChange={(changeEvent) => setOption(index, changeEvent.target.value)}
                    placeholder={`Opzione ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      aria-label={`Rimuovi opzione ${index + 1}`}
                      onClick={() => removeOption(index)}
                      className="rounded-lg p-1.5 text-ink-faint transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={() => setOptions((current) => [...current, ''])}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-surface-soft px-3.5 py-2 text-xs font-semibold text-ink-soft transition hover:bg-surface-muted"
                >
                  <PlusIcon className="h-4 w-4" /> Aggiungi opzione
                </button>
              )}
            </div>
          </Field>

          {validationError && <ErrorBanner message={validationError} />}
          {error && <ErrorBanner message={error} />}

          <Button
            type="button"
            loading={saving}
            onClick={() => void handleSubmit()}
            className="w-full"
          >
            Crea decisione
          </Button>
        </div>
      </div>
    </div>
  )
}

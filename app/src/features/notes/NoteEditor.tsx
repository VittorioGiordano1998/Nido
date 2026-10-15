import { useEffect, useState } from 'react'

import { Button, ErrorBanner, Field, TextArea, TextInput } from '../../ui/components'
import { CloseIcon, TrashIcon } from '../../ui/icons'
import type { Note, NoteInput } from './useNotes'

interface NoteEditorProps {
  /** Nota in modifica; `null` = nuova nota. */
  note: Note | null
  saving: boolean
  error: string | null
  onSave: (input: NoteInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

export function NoteEditor({ note, saving, error, onSave, onDelete, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit() {
    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    if (!trimmedTitle && !trimmedBody) {
      setValidationError('Scrivi qualcosa: un titolo o un testo.')
      return
    }
    setValidationError(null)
    await onSave({ title: trimmedTitle, body: trimmedBody })
  }

  function handleDelete() {
    if (!note) return
    if (!window.confirm('Eliminare questa nota?')) return
    void onDelete(note.id)
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
        aria-label={note ? 'Modifica nota' : 'Nuova nota'}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{note ? 'Modifica nota' : 'Nuova nota'}</h2>
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
              value={title}
              onChange={(changeEvent) => setTitle(changeEvent.target.value)}
              placeholder="Es. Codice del cancello"
              autoFocus
            />
          </Field>

          <Field label="Testo">
            <TextArea
              rows={8}
              value={body}
              onChange={(changeEvent) => setBody(changeEvent.target.value)}
              placeholder="Scrivete qui quello che volete ricordare…"
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
              {note ? 'Salva' : 'Crea nota'}
            </Button>
            {note && (
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

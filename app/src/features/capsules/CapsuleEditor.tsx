import { useState } from 'react'

import { Button, ErrorBanner, Field, TextArea, TextInput } from '../../ui/components'
import { Sheet } from '../../ui/Sheet'
import { TrashIcon } from '../../ui/icons'
import type { Capsule, CapsuleInput } from './useCapsules'

interface CapsuleEditorProps {
  capsule: Capsule | null
  saving: boolean
  error: string | null
  onSave: (input: CapsuleInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

export function CapsuleEditor({
  capsule,
  saving,
  error,
  onSave,
  onDelete,
  onClose,
}: CapsuleEditorProps) {
  const [title, setTitle] = useState(capsule?.title ?? '')
  const [body, setBody] = useState(capsule?.body ?? '')
  const [opensAt, setOpensAt] = useState(capsule?.opensAt ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleSubmit() {
    const trimmedTitle = title.trim()
    const trimmedBody = body.trim()
    if (!trimmedTitle && !trimmedBody) {
      setValidationError('Scrivi qualcosa: un titolo o un testo.')
      return
    }
    if (!opensAt) {
      setValidationError('Scegli il giorno in cui la capsula si aprirà.')
      return
    }
    setValidationError(null)
    await onSave({ title: trimmedTitle, body: trimmedBody, opensAt })
  }

  function handleDelete() {
    if (!capsule) return
    if (!window.confirm('Eliminare questa capsula?')) return
    void onDelete(capsule.id)
  }

  return (
    <Sheet title={capsule ? 'Modifica capsula' : 'Nuova capsula'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Titolo">
          <TextInput
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Es. Per il nostro primo anno"
          />
        </Field>

        <Field label="Testo">
          <TextArea
            rows={7}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Quello che vuoi dirgli e che leggerà quel giorno…"
          />
        </Field>

        <Field label="Si apre il" hint="Il partner non può leggerla prima di questa data.">
          <TextInput
            type="date"
            value={opensAt}
            onChange={(event) => setOpensAt(event.target.value)}
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
            {capsule ? 'Salva' : 'Sigilla la capsula'}
          </Button>
          {capsule && (
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={handleDelete}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
            >
              <TrashIcon className="h-4 w-4" /> Elimina
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  )
}

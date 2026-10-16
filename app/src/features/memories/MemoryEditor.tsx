import { useEffect, useRef, useState } from 'react'

import { toDateKey } from '../../core/dates'
import { Button, ErrorBanner, Field, TextInput } from '../../ui/components'
import { CloseIcon, ImageIcon } from '../../ui/icons'
import type { MemoryInput } from './useMemories'

interface MemoryEditorProps {
  /** When the memory comes from a bucket item, its title (context line). */
  bucketTitle?: string | null
  saving: boolean
  error: string | null
  onSave: (input: MemoryInput) => void
  onClose: () => void
}

/** Bottom sheet: photo (required), caption, date. Shared by Ricordi and the
 *  bucket-list completion flow (TASK-MEMO-…-001). */
export function MemoryEditor({ bucketTitle, saving, error, onSave, onClose }: MemoryEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [takenOn, setTakenOn] = useState(() => toDateKey(new Date()))
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function handleSubmit() {
    if (!file) {
      setLocalError('Scegli una foto per il ricordo.')
      return
    }
    setLocalError(null)
    onSave({ file, caption, takenOn })
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-end justify-center bg-scrim backdrop-blur-[2px] sm:items-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nuovo ricordo"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Nuovo ricordo</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink-soft"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        {bucketTitle && (
          <p className="mb-3 rounded-xl bg-sage-100 px-3 py-2 text-xs text-sage-700 dark:bg-sage-700/30 dark:text-sage-300">
            Dalla bucket list: «{bucketTitle}»
          </p>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-muted ring-1 ring-line transition hover:ring-accent-300"
          >
            {preview ? (
              <img src={preview} alt="Anteprima della foto" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full flex-col items-center justify-center gap-2 text-ink-muted">
                <ImageIcon className="h-7 w-7" />
                <span className="text-sm font-semibold">Scegli una foto</span>
                <span className="text-xs text-ink-faint">jpg, png, heic · max 5 MB</span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(changeEvent) => {
              const picked = changeEvent.target.files?.[0]
              changeEvent.target.value = ''
              if (picked) setFile(picked)
            }}
          />

          <Field label="Didascalia">
            <TextInput
              value={caption}
              onChange={(changeEvent) => setCaption(changeEvent.target.value)}
              placeholder="Cosa è successo?"
              maxLength={140}
              disabled={saving}
            />
          </Field>

          <Field label="Quando">
            <TextInput
              type="date"
              value={takenOn}
              onChange={(changeEvent) => setTakenOn(changeEvent.target.value)}
              disabled={saving}
            />
          </Field>

          {(localError || error) && <ErrorBanner message={localError ?? error ?? ''} />}

          <div className="flex items-center gap-2 pt-1">
            <Button type="button" loading={saving} onClick={handleSubmit} className="flex-1">
              Salva ricordo
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Annulla
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

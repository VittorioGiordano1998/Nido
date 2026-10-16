import { useState } from 'react'

import { Button, ErrorBanner, Field, TextInput } from '../../ui/components'
import { CloseIcon } from '../../ui/icons'

interface ReuseListSheetProps {
  sourceTitle: string
  itemCount: number
  busy: boolean
  error: string | null
  onConfirm: (title: string) => void
  onClose: () => void
}

/** "Riusa questa lista" (TASK-LIST-…-004): copy the item titles into a new,
 *  unchecked list with the name you choose. */
export function ReuseListSheet({
  sourceTitle,
  itemCount,
  busy,
  error,
  onConfirm,
  onClose,
}: ReuseListSheetProps) {
  const [title, setTitle] = useState(sourceTitle)

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-end justify-center bg-scrim backdrop-blur-[2px] sm:items-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Riusa la lista"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Riusa la lista</h2>
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
          <Field label="Nome della nuova lista">
            <TextInput
              value={title}
              onChange={(changeEvent) => setTitle(changeEvent.target.value)}
              maxLength={60}
              autoFocus
              disabled={busy}
            />
          </Field>

          <p className="text-xs text-ink-muted">
            {itemCount === 0
              ? 'La lista è vuota: verrà copiata solo la lista.'
              : `${itemCount} ${itemCount === 1 ? 'voce verrà copiata' : 'voci verranno copiate'}, tutte da fare. Foto, copertina e note restano dove sono.`}
          </p>

          {error && <ErrorBanner message={error} />}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              loading={busy}
              onClick={() => onConfirm(title)}
              className="flex-1"
            >
              Crea lista
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Annulla
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

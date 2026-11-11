import { useState } from 'react'

import { Button, ErrorBanner, Field, TextInput } from '../../ui/components'
import { Sheet } from '../../ui/Sheet'

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
    <Sheet title="Riusa la lista" onClose={onClose}>
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
    </Sheet>
  )
}

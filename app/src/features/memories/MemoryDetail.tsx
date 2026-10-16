import { formatDateIt } from '../../core/dates'
import { Button } from '../../ui/components'
import { CloseIcon, ImageIcon, TrashIcon } from '../../ui/icons'
import type { Memory } from './useMemories'

interface MemoryDetailProps {
  memory: Memory
  url: string | null
  authorName: string
  busy: boolean
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

/** Detail sheet: the full photo, caption, date, author; edit and delete live here. */
export function MemoryDetail({
  memory,
  url,
  authorName,
  busy,
  onEdit,
  onDelete,
  onClose,
}: MemoryDetailProps) {
  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-end justify-center bg-scrim backdrop-blur-[2px] sm:items-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ricordo"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Ricordo</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink-soft"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-3">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface-muted ring-1 ring-line">
            {url ? (
              <img src={url} alt={memory.caption || 'Ricordo'} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-ink-faint">
                <ImageIcon className="h-8 w-8" />
              </span>
            )}
          </div>

          {memory.caption && (
            <p className="text-balance text-sm font-semibold text-ink">{memory.caption}</p>
          )}
          <p className="text-xs text-ink-muted">
            {formatDateIt(memory.takenOn)} · {authorName}
            {memory.bucketItemId && ' · dalla bucket list'}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={onEdit}
            >
              Modifica
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={onDelete}
              className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
            >
              <TrashIcon className="h-4 w-4" /> Elimina
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy} className="ml-auto">
              Chiudi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

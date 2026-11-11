import { formatDateIt } from '../../core/dates'
import { Button } from '../../ui/components'
import { Sheet } from '../../ui/Sheet'
import { ImageIcon, TrashIcon } from '../../ui/icons'
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
    <Sheet title="Ricordo" onClose={onClose}>
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
    </Sheet>
  )
}

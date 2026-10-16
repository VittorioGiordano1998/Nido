import { Button } from '../../ui/components'
import { CloseIcon } from '../../ui/icons'

interface BucketDoneSheetProps {
  title: string
  busy: boolean
  onWithoutMemory: () => void
  onWithMemory: () => void
  onClose: () => void
}

/** Completion choice (TASK-BUCKET-…-001): mark it done with or without
 *  leaving a memory in Ricordi. */
export function BucketDoneSheet({
  title,
  busy,
  onWithoutMemory,
  onWithMemory,
  onClose,
}: BucketDoneSheetProps) {
  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-end justify-center bg-scrim backdrop-blur-[2px] sm:items-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Fatto!"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">Fatto! 🎉</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink-soft"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <p className="mb-4 text-sm text-ink-muted">
          «{title}» è nella lista delle cose fatte. Vuoi lasciarne un ricordo nei Ricordi?
        </p>

        <div className="flex flex-col gap-2">
          <Button type="button" loading={busy} onClick={onWithMemory} className="w-full">
            Aggiungi un ricordo
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={onWithoutMemory} className="w-full">
            Solo spunta
          </Button>
        </div>
      </div>
    </div>
  )
}

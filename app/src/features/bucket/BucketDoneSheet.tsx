import { Button } from '../../ui/components'
import { Sheet } from '../../ui/Sheet'

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
    <Sheet title="Fatto! 🎉" onClose={onClose}>
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
    </Sheet>
  )
}

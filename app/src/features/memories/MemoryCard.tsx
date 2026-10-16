import { formatDateIt } from '../../core/dates'
import { ImageIcon } from '../../ui/icons'
import type { Memory } from './useMemories'

const TILTS = [-1.6, 1.1, -0.8, 1.5]

interface MemoryCardProps {
  memory: Memory
  url: string | null
  index: number
  onOpen: () => void
}

/** Polaroid card: light frame, photo, caption and date; slight static tilt. */
export function MemoryCard({ memory, url, index, onOpen }: MemoryCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ transform: `rotate(${TILTS[index % TILTS.length]}deg)` }}
      className="block w-full text-left transition hover:rotate-0 focus-visible:rotate-0"
    >
      <span className="block rounded-2xl bg-surface p-2 pb-2.5 shadow-sm ring-1 ring-line/70">
        <span className="block aspect-[4/5] overflow-hidden rounded-xl bg-surface-muted">
          {url ? (
            <img
              src={url}
              alt={memory.caption || 'Ricordo'}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-ink-faint">
              <ImageIcon className="h-7 w-7" />
            </span>
          )}
        </span>
        <span className="mt-2 block px-1">
          <span className="block truncate text-sm font-semibold text-ink">
            {memory.caption.trim() || 'Un ricordo'}
          </span>
          <span className="block text-xs text-ink-muted">{formatDateIt(memory.takenOn)}</span>
        </span>
      </span>
    </button>
  )
}

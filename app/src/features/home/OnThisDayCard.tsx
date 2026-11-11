import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ImageIcon } from '../../ui/icons'
import { memoriesOnThisDay, yearsAgoLabel } from '../memories/onThisDay'
import { useMemories } from '../memories/useMemories'

/**
 * "Un anno fa oggi" on Home: the most recent memory taken on this calendar
 * day in an earlier year, as a tilted polaroid. Renders nothing when the
 * journal has no memory for today.
 */
export function OnThisDayCard() {
  const { memories, urls } = useMemories()
  const [today] = useState(() => new Date())
  const matches = useMemo(() => memoriesOnThisDay(memories, today), [memories, today])
  const memory = matches[0]
  if (!memory) return null

  const url = urls[memory.photoPath]
  return (
    <Link
      to="/us/memories"
      viewTransition
      className="group flex items-center gap-4 rounded-3xl bg-sage-soft p-4 shadow-card ring-1 ring-sage-ink/15 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span className="block w-24 shrink-0 -rotate-3 rounded-xl bg-surface p-1.5 pb-4 shadow-card ring-1 ring-line/60 transition duration-300 group-hover:rotate-0">
        <span className="block aspect-square overflow-hidden rounded-lg bg-surface-muted">
          {url ? (
            <img
              src={url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-ink-faint">
              <ImageIcon className="h-6 w-6" />
            </span>
          )}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-widest text-sage-ink">
          {yearsAgoLabel(memory.takenOn, today)}
        </span>
        <span className="block font-display text-xl font-semibold text-ink line-clamp-2">
          {memory.caption.trim() || 'Un ricordo'}
        </span>
        <span className="block text-xs text-ink-muted">
          {matches.length > 1 ? `E altri ${matches.length - 1} ricordi di questo giorno` : 'Riguardalo nei Ricordi'}
        </span>
      </span>
    </Link>
  )
}

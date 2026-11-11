import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentType, KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'

import { IconTile, Spinner } from '../../ui/components'
import type { Tone } from '../../ui/components'
import {
  CalendarIcon,
  CameraIcon,
  ChecklistIcon,
  ChevronRightIcon,
  CloseIcon,
  CompassIcon,
  GiftIcon,
  ListIcon,
  NoteIcon,
  SearchIcon,
} from '../../ui/icons'
import { useModalLayer } from '../../ui/useModalLayer'
import { useGlobalSearch } from './useGlobalSearch'
import type { SearchKind, SearchResult } from './useGlobalSearch'

const KIND_LOOK: Record<SearchKind, { icon: ComponentType<{ className?: string }>; tone: Tone }> = {
  destination: { icon: CompassIcon, tone: 'plain' },
  note: { icon: NoteIcon, tone: 'honey' },
  list: { icon: ListIcon, tone: 'sage' },
  task: { icon: ChecklistIcon, tone: 'sage' },
  event: { icon: CalendarIcon, tone: 'accent' },
  memory: { icon: CameraIcon, tone: 'sage' },
  wish: { icon: GiftIcon, tone: 'honey' },
}

/**
 * Global search overlay (TASK-SEARCH-…-002): a field on top, results grouped
 * by section below. Arrow keys move, Enter opens, Escape closes. Mounted only
 * while open, so the section hooks subscribe only for the time of a search.
 */
export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const { groups, loading } = useGlobalSearch(query)
  const listRef = useRef<HTMLDivElement>(null)
  useModalLayer(onClose)

  const flat = useMemo(() => groups.flatMap((group) => group.results), [groups])
  const active = flat[Math.min(activeIndex, flat.length - 1)]

  // Keep the highlighted row in view while moving with the keyboard.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [active?.id])

  function open(result: SearchResult) {
    void navigate(result.to, { state: result.state, viewTransition: true })
    onClose()
  }

  function onKeyDown(keyEvent: KeyboardEvent<HTMLInputElement>) {
    if (keyEvent.key === 'ArrowDown') {
      keyEvent.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, Math.max(flat.length - 1, 0)))
    } else if (keyEvent.key === 'ArrowUp') {
      keyEvent.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (keyEvent.key === 'Enter' && active) {
      keyEvent.preventDefault()
      open(active)
    }
  }

  const trimmed = query.trim()

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className="scrim-enter fixed inset-0 z-40 flex items-start justify-center bg-scrim backdrop-blur-[3px] sm:px-6 sm:pt-[10vh]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cerca in Nido"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="sheet-enter flex max-h-dvh w-full flex-col overflow-hidden bg-canvas shadow-lift ring-1 ring-line/60 sm:max-h-[72vh] sm:max-w-xl sm:rounded-[1.75rem]"
      >
        <div className="flex items-center gap-3 border-b border-line/70 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.875rem)] sm:pt-3.5">
          <SearchIcon className="h-5 w-5 shrink-0 text-ink-faint" />
          <input
            autoFocus
            value={query}
            onChange={(changeEvent) => {
              setQuery(changeEvent.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Cerca note, liste, eventi, ricordi…"
            aria-label="Cerca in Nido"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={active ? `search-${active.id}` : undefined}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-base text-ink placeholder:text-ink-faint focus:outline-none"
          />
          {loading && <Spinner className="h-4 w-4 shrink-0 text-ink-faint" />}
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi la ricerca"
            className="-mr-1.5 shrink-0 rounded-full p-1.5 text-ink-faint transition hover:bg-surface-muted hover:text-ink-soft"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={listRef}
          id="search-results"
          role="listbox"
          aria-label="Risultati"
          className="flex-1 overflow-y-auto px-3 py-3"
        >
          {flat.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-ink-muted">
              {loading
                ? 'Sto cercando…'
                : `Nessun risultato per «${trimmed}». Prova con un'altra parola.`}
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.key} className="mb-3 last:mb-0">
                <h3 className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-faint">
                  {group.title}
                </h3>
                <ul>
                  {group.results.map((result) => {
                    const isActive = result.id === active?.id
                    const look = KIND_LOOK[result.kind]
                    return (
                      <li key={result.id}>
                        <button
                          type="button"
                          id={`search-${result.id}`}
                          role="option"
                          aria-selected={isActive}
                          data-active={isActive}
                          onClick={() => open(result)}
                          onMouseMove={() => setActiveIndex(flat.indexOf(result))}
                          className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors ${
                            isActive ? 'bg-accent-100' : ''
                          }`}
                        >
                          <IconTile tone={look.tone} size="sm">
                            <look.icon className="h-4 w-4" />
                          </IconTile>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink">
                              {result.title}
                            </span>
                            <span className="block truncate text-xs text-ink-muted">
                              {result.subtitle}
                            </span>
                          </span>
                          <ChevronRightIcon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? 'text-accent-ink' : 'text-ink-faint'
                            }`}
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))
          )}
        </div>

        <p className="hidden items-center gap-3 border-t border-line/70 px-5 py-2.5 text-[11px] text-ink-faint sm:flex">
          <span>
            <kbd className="rounded bg-surface-muted px-1.5 py-0.5 font-sans font-semibold">↑↓</kbd>{' '}
            per muoverti
          </span>
          <span>
            <kbd className="rounded bg-surface-muted px-1.5 py-0.5 font-sans font-semibold">Invio</kbd>{' '}
            per aprire
          </span>
          <span>
            <kbd className="rounded bg-surface-muted px-1.5 py-0.5 font-sans font-semibold">Esc</kbd>{' '}
            per chiudere
          </span>
        </p>
      </div>
    </div>,
    document.body,
  )
}

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { Button, ErrorBanner } from '../../ui/components'
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from '../../ui/icons'
import { BackdropPhoto } from './BackdropPhoto'
import { clampFraming } from './photos'
import type { Framing } from './photos'

interface BackdropEditorProps {
  title: string
  sample: string
  url: string
  initial: Framing
  busy: boolean
  error: string | null
  onSave: (framing: Framing) => void
  onRemove?: () => void
  removeLabel?: string
  onClose: () => void
}

/** Framing editor: drag to move, slider or +/- to zoom; the preview uses the
 *  same photo layer as the cards, so what you see is what the card shows. */
export function BackdropEditor({
  title,
  sample,
  url,
  initial,
  busy,
  error,
  onSave,
  onRemove,
  removeLabel = 'Rimuovi',
  onClose,
}: BackdropEditorProps) {
  const [framing, setFraming] = useState<Framing>(clampFraming(initial))
  const drag = useRef<{ pointerX: number; pointerY: number; framing: Framing } | null>(null)

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { pointerX: event.clientX, pointerY: event.clientY, framing }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const current = drag.current
    if (!current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const dx = ((event.clientX - current.pointerX) / rect.width) * 100
    const dy = ((event.clientY - current.pointerY) / rect.height) * 100
    setFraming(clampFraming({ ...current.framing, x: current.framing.x - dx, y: current.framing.y - dy }))
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function zoomBy(delta: number) {
    setFraming((current) => clampFraming({ ...current, zoom: current.zoom + delta }))
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
        aria-label={title}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
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
          <div
            role="application"
            aria-label="Trascina per spostare la foto"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative aspect-[3/1] cursor-grab touch-none overflow-hidden rounded-2xl ring-1 ring-line active:cursor-grabbing"
          >
            <BackdropPhoto url={url} framing={framing} />
            <span className="relative flex h-full items-center justify-center px-6">
              <span className="truncate text-sm font-semibold text-white drop-shadow">
                {sample}
              </span>
            </span>
          </div>
          <p className="text-center text-xs text-ink-faint">
            Trascina la foto per spostarla; usa lo zoom per avvicinarla.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Riduci zoom"
              onClick={() => zoomBy(-0.1)}
              className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-soft hover:text-ink"
            >
              <MinusIcon className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={framing.zoom}
              onChange={(changeEvent) =>
                setFraming((current) => clampFraming({ ...current, zoom: Number(changeEvent.target.value) }))
              }
              aria-label="Zoom"
              className="w-full accent-accent-600"
            />
            <button
              type="button"
              aria-label="Aumenta zoom"
              onClick={() => zoomBy(0.1)}
              className="rounded-lg p-2 text-ink-muted transition hover:bg-surface-soft hover:text-ink"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {error && <ErrorBanner message={error} />}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              loading={busy}
              onClick={() => onSave(framing)}
              className="flex-1"
            >
              Salva
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Annulla
            </Button>
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={onRemove}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
              >
                <TrashIcon className="h-4 w-4" /> {removeLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

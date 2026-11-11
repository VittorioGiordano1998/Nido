import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { CloseIcon } from './icons'
import { useModalLayer } from './useModalLayer'

/**
 * Sheet: the one modal surface of the app. A bottom sheet on phones, a
 * centered dialog from the `sm` breakpoint up.
 *
 * It owns what every editor used to copy by hand: the scrim, the close button,
 * Escape, the body scroll lock and the initial focus. Sheets can stack (an
 * editor opened from another sheet): only the topmost one reacts to Escape.
 */

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-xl',
} as const

interface SheetProps {
  title: ReactNode
  /** One muted line under the title (e.g. the item the sheet is about). */
  subtitle?: ReactNode
  onClose: () => void
  size?: keyof typeof SIZES
  /** Replaces the ✕ button (e.g. a "Salta" link); `null` hides it. */
  closeSlot?: ReactNode
  /** When false a click on the scrim does not close the sheet. */
  dismissOnScrim?: boolean
  children: ReactNode
}

export function Sheet({
  title,
  subtitle,
  onClose,
  size = 'md',
  closeSlot,
  dismissOnScrim = true,
  children,
}: SheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  useModalLayer(onClose)

  // An autoFocus field inside wins; otherwise the panel takes the focus so
  // keyboard and screen-reader users start inside the dialog.
  useEffect(() => {
    const panel = panelRef.current
    if (panel && !panel.contains(document.activeElement)) panel.focus()
  }, [])

  return createPortal(
    <div
      role="presentation"
      onClick={dismissOnScrim ? onClose : undefined}
      className="scrim-enter fixed inset-0 z-40 flex items-end justify-center bg-scrim backdrop-blur-[3px] sm:items-center sm:p-6"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className={`sheet-enter max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.75rem] bg-canvas px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-lift outline-none ring-1 ring-line/60 sm:rounded-[1.75rem] sm:pb-5 ${SIZES[size]}`}
      >
        <header className="sticky top-0 z-10 -mx-5 mb-3 bg-canvas/95 px-5 pb-3 pt-3 backdrop-blur sm:pt-5">
          <span
            aria-hidden="true"
            className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line-strong sm:hidden"
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-xl font-semibold text-ink">
                {title}
              </h2>
              {subtitle && <p className="mt-0.5 truncate text-xs text-ink-muted">{subtitle}</p>}
            </div>
            {closeSlot === undefined ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Chiudi"
                className="-mr-1.5 shrink-0 rounded-full p-1.5 text-ink-faint transition hover:bg-surface-muted hover:text-ink-soft"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            ) : (
              closeSlot
            )}
          </div>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  )
}

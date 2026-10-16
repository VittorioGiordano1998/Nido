import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { CloseIcon } from './icons'

/**
 * Toast feedback layer (TASK-UI-…-001).
 *
 * One viewport, rendered by the provider above the router, so a toast survives
 * navigation and pops over every page. A destructive action can carry an
 * "Annulla" action: the caller restores the captured row when it runs.
 */

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onAction: () => void
}

export interface ToastInput {
  message: string
  tone?: ToastTone
  action?: ToastAction
  /**
   * Called when the toast goes away WITHOUT the action running (auto-dismiss
   * or ✕): the hook for "the undo window is closed, finish the cleanup".
   */
  onExpire?: () => void
  /** Auto-dismiss after ms (default: 5000; 8000 when the toast has an action). */
  duration?: number
}

interface ToastState extends ToastInput {
  id: string
  tone: ToastTone
}

interface ToastContextValue {
  showToast: (input: ToastInput) => string
  /** `skipExpire` is set when the action ran: the expiry hook must not fire. */
  dismissToast: (id: string, skipExpire?: boolean) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION = 5000
const ACTION_DURATION = 8000
const MAX_TOASTS = 3

function makeToastId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const timers = useRef(new Map<string, number>())
  const inputs = useRef(new Map<string, ToastInput>())

  const dismissToast = useCallback((id: string, skipExpire = false) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
    const input = inputs.current.get(id)
    inputs.current.delete(id)
    if (input && !skipExpire) input.onExpire?.()
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = makeToastId()
      const toast: ToastState = { tone: 'info', ...input, id }
      inputs.current.set(id, input)
      setToasts((current) => [...current, toast].slice(-MAX_TOASTS))
      const duration = input.duration ?? (input.action ? ACTION_DURATION : DEFAULT_DURATION)
      timers.current.set(
        id,
        window.setTimeout(() => dismissToast(id), duration),
      )
      return id
    },
    [dismissToast],
  )

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer)
    }
  }, [])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifiche"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+4.75rem)]"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="toast-enter pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-canvas shadow-lg"
          >
            <span className="min-w-0 flex-1">
              {toast.tone === 'error' && <span className="sr-only">Errore: </span>}
              {toast.message}
            </span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onAction()
                  dismissToast(toast.id, true)
                }}
                className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1 font-semibold transition hover:bg-white/25"
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Chiudi notifica"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-lg p-1 opacity-70 transition hover:opacity-100"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast richiede ToastProvider')
  return ctx
}

import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

/**
 * Error boundary (TASK-ROB-…-001): a crashed view shows a friendly fallback
 * instead of a white screen. Two levels in the app: the root one (`fullPage`)
 * and one around the shell outlet, whose `resetKey` clears the error on route
 * change so navigating away recovers without a reload.
 */

interface ErrorBoundaryProps {
  children: ReactNode
  /** Full-page centering for the root boundary; inline for the shell one. */
  fullPage?: boolean
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * The reset happens by remount: the shell mounts this boundary with
 * `key={location.pathname}`, so navigating away from a crashed page clears it.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // No logging wrapper in this project: the boundary is the last line of sight.
    console.error('Nido: errore di rendering', error, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children

    return (
      <div
        className={
          this.props.fullPage
            ? 'flex min-h-dvh items-center justify-center p-6'
            : 'flex items-center justify-center px-4 py-10'
        }
      >
        <div className="w-full max-w-md space-y-3 rounded-2xl bg-surface p-6 text-center shadow-sm ring-1 ring-line">
          <p className="text-lg font-bold text-ink">Qualcosa è andato storto</p>
          <p className="text-sm text-ink-muted">
            I vostri dati sono al sicuro. Ricaricate la pagina per tornare al nido.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
          >
            Ricarica
          </button>
        </div>
      </div>
    )
  }
}

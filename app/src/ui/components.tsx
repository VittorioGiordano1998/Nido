import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="h-7 w-7 text-accent-glyph" />
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const variants = {
    primary: 'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 disabled:bg-accent-300',
    secondary:
      'bg-surface text-ink ring-1 ring-line hover:bg-surface-soft disabled:text-ink-faint',
    ghost: 'text-accent-ink hover:bg-accent-100 disabled:text-ink-faint',
  } as const

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`w-full rounded-xl bg-surface px-4 py-3 text-sm text-ink ring-1 ring-line placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-400 ${className}`}
    />
  )
}

export function TextArea({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...rest}
      className={`w-full resize-none rounded-xl bg-surface px-4 py-3 text-sm text-ink ring-1 ring-line placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-400 ${className}`}
    />
  )
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={`w-full rounded-xl bg-surface px-4 py-3 text-sm text-ink ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-accent-400 ${className}`}
    />
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line/70 ${className}`}>
      {children}
    </div>
  )
}

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto flex min-h-dvh w-full max-w-md flex-col ${className}`}>
      {children}
    </div>
  )
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  /** Small original line art (ui/illustrations); falls back to `icon`. */
  illustration?: ReactNode
  title: string
  description: string
  /** Call to action (a Button or a Link styled as one). */
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-8 text-center">
      {illustration ?? icon}
      <p className="text-sm font-semibold text-ink-soft">{title}</p>
      <p className="max-w-xs text-balance text-sm text-ink-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900">
      {message}
    </div>
  )
}

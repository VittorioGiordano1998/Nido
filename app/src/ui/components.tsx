import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'

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

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'sm'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-md shadow-accent-600/25 hover:shadow-lg hover:shadow-accent-600/35 active:scale-[0.98] disabled:bg-none disabled:bg-accent-300 disabled:shadow-none',
  secondary:
    'bg-surface text-ink shadow-card ring-1 ring-line hover:bg-surface-soft active:scale-[0.98] disabled:text-ink-faint',
  ghost: 'text-accent-ink hover:bg-accent-100 disabled:text-ink-faint',
  danger:
    'text-red-600 hover:bg-red-50 disabled:text-ink-faint dark:text-red-400 dark:hover:bg-red-950/60',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  md: 'px-4 py-3',
  sm: 'px-3.5 py-2',
}

/** The shared look of Button and ButtonLink. */
function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
): string {
  return `inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={buttonClass(variant, size, className)}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}

/** A router link that looks like a Button (navigations that read as actions). */
export function ButtonLink({
  variant = 'primary',
  size = 'sm',
  className = '',
  children,
  ...rest
}: LinkProps & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <Link viewTransition {...rest} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  )
}

const FIELD_CLASS =
  'w-full rounded-xl bg-surface px-4 py-3 text-sm text-ink ring-1 ring-line transition placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-400'

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`${FIELD_CLASS} ${className}`} />
}

export function TextArea({
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${FIELD_CLASS} resize-none ${className}`} />
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={`${FIELD_CLASS} ${className}`} />
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

const CARD_TONES = {
  plain: 'bg-surface ring-line/60',
  accent: 'bg-accent-50 ring-accent-200',
  sage: 'bg-sage-soft ring-sage-ink/15',
  honey: 'bg-honey-soft ring-honey-ink/15',
} as const

export type Tone = keyof typeof CARD_TONES

export function Card({
  children,
  className = '',
  tone = 'plain',
  interactive = false,
}: {
  children: ReactNode
  className?: string
  /** Tinted surface: accent, sage or honey; plain is the white card. */
  tone?: Tone
  /** Lifts on hover: use when the whole card is a link or a button. */
  interactive?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-4 shadow-card ring-1 ${CARD_TONES[tone]} ${
        interactive
          ? 'transition duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:ring-accent-300'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

const TILE_TONES: Record<Tone, string> = {
  plain: 'bg-surface-muted text-ink-soft',
  accent: 'bg-accent-100 text-accent-ink',
  sage: 'bg-sage-soft text-sage-ink',
  honey: 'bg-honey-soft text-honey-ink',
}

const TILE_SIZES = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-12 w-12 rounded-2xl',
} as const

/** A rounded tinted square holding an icon (hub tiles, list rows, search). */
export function IconTile({
  children,
  tone = 'accent',
  size = 'md',
  className = '',
}: {
  children: ReactNode
  tone?: Tone
  size?: keyof typeof TILE_SIZES
  className?: string
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${TILE_SIZES[size]} ${TILE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
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
  /** Call to action (a Button or a ButtonLink). */
  action?: ReactNode
}) {
  const art = illustration ?? icon
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong bg-surface/50 px-6 py-9 text-center">
      {art && (
        <span className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 ring-1 ring-accent-200/70">
          {art}
        </span>
      )}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      <p className="max-w-xs text-balance text-sm text-ink-muted">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

/** The dashed "nothing matches" line shown when a search filter is empty. */
export function NoMatches({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-line-strong bg-surface/50 px-4 py-6 text-center text-sm text-ink-faint">
      {children}
    </p>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900"
    >
      {message}
    </div>
  )
}

import type { ReactNode } from 'react'

import { Brand } from './Brand'
import { CalendarIcon, CameraIcon, ChatIcon } from './icons'

const HIGHLIGHTS = [
  { icon: CalendarIcon, text: 'Calendario, liste e note sempre in due.' },
  { icon: ChatIcon, text: 'Una domanda al giorno, da scoprire insieme.' },
  { icon: CameraIcon, text: 'I ricordi, uno per ogni momento che conta.' },
] as const

/**
 * EntryLayout: the frame of the screens outside the app shell (login, pairing,
 * setup). One centered column on phones; from `lg` a brand panel sits beside
 * the form.
 */
export function EntryLayout({
  title,
  description,
  backdrop,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  /** Decorative layer behind the form column (e.g. the login dot grid). */
  backdrop?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-accent-200 via-accent-50 to-sage-soft p-12 lg:flex lg:flex-col lg:justify-between">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-300/50 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-sage-300/40 blur-3xl"
        />
        <div className="relative">
          <Brand size="lg" />
        </div>
        <div className="relative space-y-4">
          <p className="font-display text-5xl font-semibold leading-[1.08] text-ink text-balance">
            Il posto delle cose vostre.
          </p>
          <p className="max-w-sm text-base text-ink-soft">
            Uno spazio privato per due: quello che vi serve ogni giorno e quello che volete
            ricordare.
          </p>
        </div>
        <ul className="relative space-y-3">
          {HIGHLIGHTS.map((item) => (
            <li key={item.text} className="flex items-center gap-3 text-sm font-medium text-ink-soft">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface/70 text-accent-ink ring-1 ring-line/50">
                <item.icon className="h-5 w-5" />
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </aside>

      <div className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-6 py-10">
        {backdrop && (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {backdrop}
          </div>
        )}
        <div className="relative mx-auto flex w-full max-w-md flex-col gap-6">
          <header className="space-y-3 text-center lg:text-left">
            <div className="flex justify-center lg:hidden">
              <Brand size="lg" />
            </div>
            <h1 className="text-balance text-3xl font-semibold leading-tight text-ink lg:text-4xl">
              {title}
            </h1>
            {description && <p className="text-pretty text-sm text-ink-muted">{description}</p>}
          </header>
          {children}
        </div>
      </div>
    </div>
  )
}

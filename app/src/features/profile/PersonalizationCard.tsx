import { useState } from 'react'

import { ACCENT_OPTIONS, THEME_OPTIONS } from '../../core/appearance'
import type { Accent, Theme } from '../../core/appearance'
import { Card, ErrorBanner } from '../../ui/components'
import { usePreferences } from '../settings/PreferencesProvider'

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function PersonalizationCard() {
  const { theme, accent, setTheme, setAccent } = usePreferences()
  const [error, setError] = useState<string | null>(null)

  function changeTheme(next: Theme) {
    if (next === theme) return
    setError(null)
    void setTheme(next).catch((err: unknown) => setError(message(err)))
  }

  function changeAccent(next: Accent) {
    if (next === accent) return
    setError(null)
    void setAccent(next).catch((err: unknown) => setError(message(err)))
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Personalizzazione
      </h2>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Tema
          </p>
          <div className="flex rounded-xl bg-surface-muted p-1 text-sm font-semibold">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={theme === option.value}
                onClick={() => changeTheme(option.value)}
                className={`flex-1 rounded-lg py-2 transition ${
                  theme === option.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Accento
          </p>
          <div className="flex items-center gap-3">
            {ACCENT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={`Accento ${option.label}`}
                aria-pressed={accent === option.value}
                onClick={() => changeAccent(option.value)}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-surface transition ${
                  accent === option.value ? 'ring-accent-600' : 'ring-transparent'
                }`}
                style={{ backgroundColor: option.swatch }}
              />
            ))}
          </div>
        </div>
        {error && <ErrorBanner message={error} />}
      </div>
    </Card>
  )
}

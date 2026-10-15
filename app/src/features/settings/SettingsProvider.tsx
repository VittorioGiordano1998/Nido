import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Sezioni attivabili/disattivabili (piano §0.5).
 * Per ora la preferenza è locale al dispositivo (localStorage); la
 * sincronizzazione col partner è una decisione futura.
 */
export const SECTION_DEFS = [
  {
    key: 'calendar',
    label: 'Calendario',
    description: 'Eventi condivisi, ricorrenze e promemoria.',
  },
  {
    key: 'lists',
    label: 'Liste',
    description: 'Spesa, film, valigie: liste condivise.',
  },
  {
    key: 'us',
    label: 'Noi',
    description: 'Domande, decisioni, wishlist e altro.',
  },
] as const

export type SectionKey = (typeof SECTION_DEFS)[number]['key']

type EnabledMap = Record<SectionKey, boolean>

const STORAGE_KEY = 'nido.sections.v1'
const REMINDERS_KEY = 'nido.reminders.v1'

function loadRemindersEnabled(): boolean {
  try {
    return window.localStorage.getItem(REMINDERS_KEY) === '1'
  } catch {
    return false
  }
}

function loadEnabled(): EnabledMap {
  const defaults: EnabledMap = { calendar: true, lists: true, us: true }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      calendar: typeof parsed.calendar === 'boolean' ? parsed.calendar : defaults.calendar,
      lists: typeof parsed.lists === 'boolean' ? parsed.lists : defaults.lists,
      us: typeof parsed.us === 'boolean' ? parsed.us : defaults.us,
    }
  } catch {
    return defaults
  }
}

type SettingsContextValue = {
  enabled: EnabledMap
  toggle: (key: SectionKey) => void
  /** Per-device local reminders for calendar events (Notification API). */
  remindersEnabled: boolean
  setRemindersEnabled: (value: boolean) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState<EnabledMap>(loadEnabled)
  const [remindersEnabled, setRemindersEnabledState] = useState(loadRemindersEnabled)

  const setRemindersEnabled = useCallback((value: boolean) => {
    setRemindersEnabledState(value)
    try {
      window.localStorage.setItem(REMINDERS_KEY, value ? '1' : '0')
    } catch {
      // localStorage non disponibile: la preferenza resta in memoria.
    }
  }, [])

  const toggle = useCallback((key: SectionKey) => {
    setEnabled((current) => {
      const next = { ...current, [key]: !current[key] }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // localStorage non disponibile (Safari privato): la preferenza resta in memoria.
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ enabled, toggle, remindersEnabled, setRemindersEnabled }),
    [enabled, toggle, remindersEnabled, setRemindersEnabled],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings richiede SettingsProvider')
  return ctx
}

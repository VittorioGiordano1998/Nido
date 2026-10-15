import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import {
  applyAppearance,
  DEFAULT_ACCENT,
  DEFAULT_THEME,
  isAccent,
  isTheme,
  readCachedAppearance,
} from '../../core/appearance'
import type { Accent, Theme } from '../../core/appearance'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'

/**
 * Account-level appearance preferences (profiles.theme / profiles.accent).
 *
 * Optimistic updates: the DOM changes first, the row follows; a failed write
 * rolls the DOM back. The cached pair (core/appearance) keeps the app
 * consistent while the row loads and powers the pre-paint script.
 */

type PreferencesContextValue = {
  theme: Theme
  accent: Accent
  setTheme: (theme: Theme) => Promise<void>
  setAccent: (accent: Accent) => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id

  const [theme, setThemeState] = useState<Theme>(() => readCachedAppearance().theme)
  const [accent, setAccentState] = useState<Accent>(() => readCachedAppearance().accent)

  // Load the account row on sign-in (and on an account switch). The cached
  // pair is already applied by the pre-paint script, so nothing flashes.
  useEffect(() => {
    if (!userId) return
    let active = true
    void (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('theme, accent')
        .eq('id', userId)
        .single()
      if (!active || error || !data) return
      const nextTheme = isTheme(data.theme) ? data.theme : DEFAULT_THEME
      const nextAccent = isAccent(data.accent) ? data.accent : DEFAULT_ACCENT
      setThemeState(nextTheme)
      setAccentState(nextAccent)
      applyAppearance(nextTheme, nextAccent)
    })()
    return () => {
      active = false
    }
  }, [userId])

  // While the preference is 'system', follow the OS live.
  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyAppearance(theme, accent)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme, accent])

  const persist = useCallback(
    async (patch: { theme?: Theme; accent?: Accent }) => {
      if (!userId) return
      const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
      if (error) throw new Error(error.message)
    },
    [userId],
  )

  const setTheme = useCallback(
    async (next: Theme) => {
      const previous = theme
      setThemeState(next)
      applyAppearance(next, accent)
      try {
        await persist({ theme: next })
      } catch (error) {
        setThemeState(previous)
        applyAppearance(previous, accent)
        throw error
      }
    },
    [accent, persist, theme],
  )

  const setAccent = useCallback(
    async (next: Accent) => {
      const previous = accent
      setAccentState(next)
      applyAppearance(theme, next)
      try {
        await persist({ accent: next })
      } catch (error) {
        setAccentState(previous)
        applyAppearance(theme, previous)
        throw error
      }
    },
    [accent, persist, theme],
  )

  const value = useMemo(
    () => ({ theme, accent, setTheme, setAccent }),
    [theme, accent, setTheme, setAccent],
  )

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences richiede PreferencesProvider')
  return ctx
}

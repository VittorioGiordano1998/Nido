/**
 * Appearance: theme and accent in one place.
 *
 * The active theme lives on <html> as two data attributes — data-theme,
 * resolved to 'light' | 'dark', and data-accent, the preset id — which the
 * CSS in src/index.css turns into colors. The same pair is cached in
 * localStorage so the pre-paint script in index.html can apply it before the
 * first render (no light flash on reload).
 *
 * The accent preset ids are mirrored by the SQL check constraint in
 * supabase/migrations/20261015101500_nido_profile_preferences.sql: keep the
 * two lists in sync.
 */

export const THEME_OPTIONS = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Chiaro' },
  { value: 'dark', label: 'Scuro' },
] as const

export type Theme = (typeof THEME_OPTIONS)[number]['value']

export const ACCENT_OPTIONS = [
  { value: 'terra', label: 'Terra', swatch: '#c25532' },
  { value: 'oliva', label: 'Oliva', swatch: '#60763a' },
  { value: 'mare', label: 'Mare', swatch: '#316e8d' },
  { value: 'prugna', label: 'Prugna', swatch: '#784c7b' },
] as const

export type Accent = (typeof ACCENT_OPTIONS)[number]['value']

export const DEFAULT_THEME: Theme = 'system'
export const DEFAULT_ACCENT: Accent = 'terra'

/** Shared with the pre-paint script in index.html: keep the literal in sync. */
const APPEARANCE_CACHE_KEY = 'nido.appearance.v1'

export function isTheme(value: unknown): value is Theme {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function isAccent(value: unknown): value is Accent {
  return ACCENT_OPTIONS.some((option) => option.value === value)
}

/** 'system' follows the OS; the CSS only ever sees a resolved value. */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function readCachedAppearance(): { theme: Theme; accent: Accent } {
  try {
    const raw = window.localStorage.getItem(APPEARANCE_CACHE_KEY)
    if (!raw) return { theme: DEFAULT_THEME, accent: DEFAULT_ACCENT }
    const parsed = JSON.parse(raw) as { theme?: unknown; accent?: unknown }
    return {
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_THEME,
      accent: isAccent(parsed.accent) ? parsed.accent : DEFAULT_ACCENT,
    }
  } catch {
    return { theme: DEFAULT_THEME, accent: DEFAULT_ACCENT }
  }
}

/**
 * Applies the pair to the document, updates the browser chrome color and
 * refreshes the cache the pre-paint script reads. One DOM side effect; the
 * caller owns persistence (profiles.theme / profiles.accent).
 */
export function applyAppearance(theme: Theme, accent: Accent): void {
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.dataset.theme = resolved
  root.dataset.accent = accent

  // The canvas color comes from the CSS tokens: one source of truth.
  const canvas = getComputedStyle(root).getPropertyValue('--color-canvas').trim()
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta && canvas) meta.setAttribute('content', canvas)

  try {
    window.localStorage.setItem(APPEARANCE_CACHE_KEY, JSON.stringify({ theme, accent }))
  } catch {
    // Private mode: the cache is best-effort, the app still works.
  }
}

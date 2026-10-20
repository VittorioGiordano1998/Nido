const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const rawVapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
const rawTestTools = import.meta.env.VITE_ENABLE_TEST_TOOLS

/**
 * Configurazione da `.env.local` (vedi `.env.example`).
 * Valori assenti = schermata di setup invece di un crash all'avvio.
 */
export const env = {
  supabaseUrl: typeof rawUrl === 'string' ? rawUrl.trim() : '',
  supabaseAnonKey: typeof rawAnonKey === 'string' ? rawAnonKey.trim() : '',
  vapidPublicKey: typeof rawVapidPublicKey === 'string' ? rawVapidPublicKey.trim() : '',
  /** Opt-in: shows the "Zona test" data reset in the profile. Off unless set to `true`. */
  testToolsEnabled: typeof rawTestTools === 'string' && rawTestTools.trim() === 'true',
}

export const isSupabaseConfigured =
  env.supabaseUrl.startsWith('http') && env.supabaseAnonKey.length > 0

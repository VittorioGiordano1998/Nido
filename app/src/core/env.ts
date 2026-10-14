const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Configurazione da `.env.local` (vedi `.env.example`).
 * Valori assenti = schermata di setup invece di un crash all'avvio.
 */
export const env = {
  supabaseUrl: typeof rawUrl === 'string' ? rawUrl.trim() : '',
  supabaseAnonKey: typeof rawAnonKey === 'string' ? rawAnonKey.trim() : '',
}

export const isSupabaseConfigured =
  env.supabaseUrl.startsWith('http') && env.supabaseAnonKey.length > 0

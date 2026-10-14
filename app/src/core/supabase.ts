import { createClient } from '@supabase/supabase-js'

import { env, isSupabaseConfigured } from './env'

/**
 * Client Supabase unico dell'app.
 * Senza configurazione viene creato un client placeholder: l'app mostra la
 * schermata di setup e non chiama mai il backend finché le variabili mancano.
 */
export const supabase = createClient(
  isSupabaseConfigured ? env.supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? env.supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

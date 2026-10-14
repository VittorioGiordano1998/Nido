import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '../../core/supabase'

function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email o password non corretti.'
  if (m.includes('email not confirmed'))
    return 'Devi prima confermare la tua email: controlla la posta.'
  if (m.includes('user already registered')) return 'Esiste già un account con questa email.'
  if (m.includes('password should be at least'))
    return 'La password deve avere almeno 6 caratteri.'
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Troppi tentativi: riprova tra qualche minuto.'
  if (m.includes('provider is not enabled'))
    return 'Accesso Google non ancora abilitato su Supabase.'
  return message
}

type AuthContextValue = {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ needsEmailConfirm: boolean }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(translateAuthError(error.message))
      },
      signUp: async (email, password, displayName) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
        if (error) throw new Error(translateAuthError(error.message))
        return { needsEmailConfirm: !data.session }
      },
      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        })
        if (error) throw new Error(translateAuthError(error.message))
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth richiede AuthProvider')
  return ctx
}

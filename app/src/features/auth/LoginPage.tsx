import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { Button, Card, ErrorBanner, Field, Screen, TextInput } from '../../ui/components'
import DotGrid from '../../ui/reactbits/DotGrid'
import { useAuth } from './AuthProvider'

export function LoginPage() {
  const { session, signIn, signUp, signInWithGoogle } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSent, setConfirmSent] = useState(false)

  // RequireAuth remembers where the visitor was headed (e.g. /pair?code=…):
  // after signing in they land there instead of Home.
  const from = location.state as { from?: { pathname?: string; search?: string } } | null
  const target = from?.from?.pathname ? `${from.from.pathname}${from.from.search ?? ''}` : '/'

  if (session) return <Navigate to={target} replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password)
      } else {
        const { needsEmailConfirm } = await signUp(email.trim(), password, displayName.trim())
        if (needsEmailConfirm) setConfirmSent(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Screen className="relative justify-center gap-6 overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <DotGrid
          dotSize={3}
          gap={22}
          baseColor="#d8c9bd"
          activeColor="#c25532"
          glow={0.5}
          opacity={0.55}
          proximity={120}
          fade={1}
        />
      </div>
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-glyph">Nido</p>
        <h1 className="text-3xl font-bold text-ink">
          {mode === 'signin' ? 'Bentornato' : 'Crea il vostro nido'}
        </h1>
        <p className="text-sm text-ink-muted">
          Lo spazio privato dove la vostra coppia tiene le cose importanti.
        </p>
      </header>

      {confirmSent ? (
        <Card>
          <p className="text-sm text-ink-soft">
            Ti abbiamo inviato un'email di conferma a <strong>{email.trim()}</strong>: aprila per
            attivare l'account, poi torna qui ad accedere.
          </p>
        </Card>
      ) : (
        <Card className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <Field label="Il tuo nome">
                <TextInput
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Es. Giulia"
                  autoComplete="given-name"
                  required
                />
              </Field>
            )}
            <Field label="Email">
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.it"
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Almeno 6 caratteri"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
              />
            </Field>

            {error && <ErrorBanner message={error} />}

            <Button type="submit" loading={pending} className="w-full">
              {mode === 'signin' ? 'Accedi' : 'Registrati'}
            </Button>
          </form>

          <div className="flex items-center gap-3 text-xs text-ink-faint">
            <span className="h-px flex-1 bg-line" />
            oppure
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setError(null)
              signInWithGoogle().catch((err: unknown) =>
                setError(err instanceof Error ? err.message : 'Errore con Google.'),
              )
            }}
          >
            Continua con Google
          </Button>

          <p className="text-center text-sm text-ink-muted">
            {mode === 'signin' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
            <button
              type="button"
              className="font-semibold text-accent-ink hover:underline"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
              }}
            >
              {mode === 'signin' ? 'Registrati' : 'Accedi'}
            </button>
          </p>
        </Card>
      )}
    </Screen>
  )
}

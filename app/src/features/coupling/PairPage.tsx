import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import QRCode from 'react-qr-code'

import {
  Button,
  Card,
  ErrorBanner,
  Field,
  FullPageSpinner,
  Screen,
  TextInput,
} from '../../ui/components'
import { CheckIcon, CopyIcon } from '../../ui/icons'
import StarBorder from '../../ui/reactbits/StarBorder'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from './CoupleProvider'

export function PairPage() {
  const { session, signOut } = useAuth()
  const { couple, loading, createCouple, joinCouple, refresh } = useCouple()
  const [searchParams] = useSearchParams()

  // A scanned invite link (/pair?code=XXXX) opens straight into the join form
  // with the code prefilled.
  const [mode, setMode] = useState<'create' | 'join'>(() =>
    searchParams.get('code') ? 'join' : 'create',
  )
  const [coupleName, setCoupleName] = useState('Noi')
  const [startedAt, setStartedAt] = useState('')
  const [code, setCode] = useState(() => (searchParams.get('code') ?? '').toUpperCase())
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const waitingForPartner = couple !== null && couple.members.length < 2

  const inviteUrl = couple?.inviteCode
    ? `${window.location.origin}/pair?code=${couple.inviteCode}`
    : ''

  useEffect(() => {
    if (!waitingForPartner) return
    const timer = window.setInterval(() => {
      void refresh()
    }, 5000)
    return () => window.clearInterval(timer)
  }, [waitingForPartner, refresh])

  if (loading) return <FullPageSpinner />
  if (couple && couple.members.length >= 2) return <Navigate to="/" replace />

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await createCouple({ name: coupleName.trim() || 'Noi', startedAt: startedAt || null })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la creazione.')
    } finally {
      setPending(false)
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await joinCouple(code.trim().toUpperCase())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'ingresso.')
    } finally {
      setPending(false)
    }
  }

  async function copyCode() {
    if (!couple?.inviteCode) return
    try {
      await navigator.clipboard.writeText(couple.inviteCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Contesto non sicuro (http): il codice resta visibile e copiabile a mano.
    }
  }

  if (waitingForPartner && couple?.inviteCode) {
    return (
      <Screen className="justify-center gap-6 px-6 py-10">
        <header className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent-glyph">Nido</p>
          <h1 className="text-2xl font-bold text-ink">Invita il tuo partner</h1>
          <p className="text-sm text-ink-muted">
            Fai entrare {couple.name ? `"${couple.name}"` : 'la vostra coppia'} nell'app con questo
            codice:
          </p>
        </header>

        <Card className="space-y-4 text-center">
          {inviteUrl && (
            <div className="mx-auto w-fit rounded-2xl bg-white p-3 ring-1 ring-line-strong">
              {/* Nero su bianco di proposito: un QR invertito non è leggibile da tutti gli scanner. */}
              <QRCode value={inviteUrl} size={148} fgColor="#1c1917" bgColor="#ffffff" />
            </div>
          )}
          <p className="font-mono text-3xl font-bold tracking-[0.3em] text-accent-ink">
            {couple.inviteCode}
          </p>
          <p className="text-xs text-ink-muted">
            Il partner può inquadrare il codice, oppure inserirlo a mano.
          </p>
          <StarBorder
            as="button"
            type="button"
            onClick={() => void copyCode()}
            className="w-full text-sm font-semibold"
            style={{ padding: '0.75rem 1rem' }}
            radius={12}
            thickness={1}
            color="#e48f6f"
            trailColor="#c25532"
            backgroundColor="#fdf6f2"
            textColor="#a2432a"
            borderColor="rgba(194, 85, 50, 0.18)"
            duration={6}
            glow={0.7}
            trailLength={0.25}
            hover="brighten"
            sparkle
          >
            {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
            {copied ? 'Copiato' : 'Copia codice'}
          </StarBorder>
          <p className="text-xs text-ink-faint">
            In attesa che il partner lo inserisca… l'app si aggiorna da sola.
          </p>
        </Card>

        <Button variant="ghost" onClick={() => void refresh()}>
          Aggiorna ora
        </Button>

        <button
          type="button"
          onClick={() => void signOut()}
          className="text-center text-xs text-ink-faint hover:text-ink-soft"
        >
          Esci ({session?.user.email})
        </button>
      </Screen>
    )
  }

  return (
    <Screen className="justify-center gap-6 px-6 py-10">
      <header className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent-glyph">Nido</p>
        <h1 className="text-2xl font-bold text-ink">Create il vostro spazio</h1>
        <p className="text-sm text-ink-muted">
          Crea una nuova coppia e invita il partner, oppure inserisci il codice che ti ha mandato.
        </p>
      </header>

      <div className="flex rounded-xl bg-surface-muted p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => {
            setMode('create')
            setError(null)
          }}
          className={`flex-1 rounded-lg py-2 transition ${mode === 'create' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'}`}
        >
          Crea una coppia
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('join')
            setError(null)
          }}
          className={`flex-1 rounded-lg py-2 transition ${mode === 'join' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'}`}
        >
          Ho un codice
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {mode === 'create' ? (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Nome della coppia">
              <TextInput
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder="Noi"
              />
            </Field>
            <Field label="Da quando state insieme?" hint="Opzionale — serve per i giorni insieme.">
              <TextInput
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
            </Field>
            <Button type="submit" loading={pending} className="w-full">
              Crea e ottieni il codice
            </Button>
          </form>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleJoin} className="space-y-4">
            <Field label="Codice invito">
              <TextInput
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Es. H7K2QM9P"
                maxLength={8}
                autoCapitalize="characters"
                required
              />
            </Field>
            <Button type="submit" loading={pending} className="w-full">
              Entra nella coppia
            </Button>
          </form>
        </Card>
      )}

      <button
        type="button"
        onClick={() => void signOut()}
        className="text-center text-xs text-ink-faint hover:text-ink-soft"
      >
        Esci ({session?.user.email})
      </button>
    </Screen>
  )
}

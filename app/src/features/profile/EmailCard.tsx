import { useState } from 'react'

import { Button, Card, ErrorBanner, Field, TextInput } from '../../ui/components'
import { useAuth } from '../auth/AuthProvider'

/** Changes the account email — the address used to sign in and the one the
 *  reminder emails are sent to. Supabase applies it only after the link sent
 *  to the new address (and the old one, with double confirmation) is opened. */
export function EmailCard() {
  const { session, changeEmail } = useAuth()
  const current = session?.user.email ?? ''
  const pending = session?.user.new_email ?? null
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleChange() {
    const next = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(next)) {
      setError('Indirizzo email non valido.')
      return
    }
    if (next.toLowerCase() === current.toLowerCase()) {
      setError('È già la tua email attuale.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await changeEmail(next)
      setSentTo(next)
      setEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const waitingFor = sentTo ?? pending

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Email
      </h2>
      <div className="space-y-4">
        <p className="text-xs text-ink-muted">
          Le comunicazioni arrivano a <span className="font-semibold text-ink">{current}</span>.
        </p>
        <Field label="Nuova email">
          <TextInput
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {error && <ErrorBanner message={error} />}
        {waitingFor && (
          <p className="text-xs text-ink-muted">
            Ti abbiamo scritto per confermare {waitingFor}: apri il link nel messaggio (anche in
            quello inviato all'indirizzo attuale, se lo chiede) e il cambio sarà attivo.
          </p>
        )}
        <Button
          onClick={() => void handleChange()}
          loading={saving}
          disabled={!email.trim()}
          className="w-full"
        >
          Cambia email
        </Button>
      </div>
    </Card>
  )
}

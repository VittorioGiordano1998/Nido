import { useState } from 'react'

import { Button, Card, ErrorBanner, Field, TextInput } from '../../ui/components'
import { CheckIcon } from '../../ui/icons'
import { useAuth } from '../auth/AuthProvider'

export function SecurityCard() {
  const { changePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange() {
    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri.')
      return
    }
    if (password !== confirm) {
      setError('Le due password non coincidono.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await changePassword(password)
      setPassword('')
      setConfirm('')
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Sicurezza
      </h2>
      <div className="space-y-4">
        <Field label="Nuova password" hint="Almeno 6 caratteri.">
          <TextInput
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Conferma password">
          <TextInput
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        {error && <ErrorBanner message={error} />}
        <Button
          onClick={() => void handleChange()}
          loading={saving}
          disabled={!password || !confirm}
          className="w-full"
        >
          {saved ? (
            <>
              <CheckIcon className="h-4 w-4" /> Password aggiornata
            </>
          ) : (
            'Aggiorna password'
          )}
        </Button>
      </div>
    </Card>
  )
}

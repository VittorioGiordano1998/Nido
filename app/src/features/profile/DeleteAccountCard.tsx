import { useState } from 'react'

import { supabase } from '../../core/supabase'
import { Button, Card, ErrorBanner, TextInput } from '../../ui/components'
import { useAuth } from '../auth/AuthProvider'

/**
 * GDPR account deletion (TASK-GDPR-VITTORIOGIORDANOYBQ-001): the signed-in
 * user deletes their own account through the `delete-account` Edge Function
 * (deploy it first — README §"Eliminazione account e reset"). A partner who
 * stays keeps the couple and the shared rows; when nobody is left the couple
 * is removed too.
 */
export function DeleteAccountCard() {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = confirmText.trim().toUpperCase() === 'ELIMINA'

  async function handleDelete() {
    if (!ready || busy) return
    setBusy(true)
    setError(null)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      })
      if (invokeError) throw new Error(invokeError.message)
      const payload = data as { error?: string } | null
      if (payload?.error) throw new Error(payload.error)
      await signOut()
      window.location.assign('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore durante l'eliminazione."
      setError(
        /failed to send|not found|404/i.test(message)
          ? 'La funzione delete-account non è pubblicata: vedi il README.'
          : message,
      )
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Elimina account
      </h2>
      <div className="space-y-3">
        <p className="text-xs text-ink-muted">
          Elimina il tuo account e i tuoi dati. Se il partner resta, tiene la coppia e le cose
          condivise; se resti da solo, il nido viene svuotato. L'operazione non si può annullare.
        </p>
        {error && <ErrorBanner message={error} />}
        {open ? (
          <div className="space-y-2">
            <TextInput
              value={confirmText}
              onChange={(changeEvent) => setConfirmText(changeEvent.target.value)}
              placeholder="Scrivi ELIMINA per confermare"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={busy}
                onClick={() => {
                  setOpen(false)
                  setConfirmText('')
                }}
              >
                Annulla
              </Button>
              <Button
                variant="ghost"
                className="flex-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
                loading={busy}
                disabled={!ready}
                onClick={() => void handleDelete()}
              >
                Elimina il mio account
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
            onClick={() => setOpen(true)}
          >
            Elimina il mio account
          </Button>
        )}
      </div>
    </Card>
  )
}

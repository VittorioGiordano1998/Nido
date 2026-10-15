import { useState } from 'react'

import { supabase } from '../../core/supabase'
import { Button, Card, ErrorBanner, TextInput } from '../../ui/components'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Test tool (owner request, TASK-TEST-VITTORIOGIORDANOYBQ-001): clears the
 * couple's feature data so the flows can be re-run from a clean slate.
 * Requires `supabase/apply-reset-couple.sql` on the project. Not a product
 * feature: review before any public use (it clears cycle data too).
 */
export function TestToolsCard() {
  const { couple } = useCouple()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = confirmText.trim().toUpperCase() === 'RESET'

  async function handleReset() {
    if (!couple || !ready || busy) return
    setBusy(true)
    setError(null)
    try {
      const { error: rpcError } = await supabase.rpc('reset_couple_data', {
        target_couple: couple.id,
      })
      if (rpcError) throw new Error(rpcError.message)
      setDone(true)
      window.setTimeout(() => window.location.reload(), 900)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore durante il reset.'
      setError(
        /function|schema cache|does not exist/i.test(message)
          ? 'La funzione manca: incolla supabase/apply-reset-couple.sql nel progetto Supabase.'
          : message,
      )
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Zona test
      </h2>

      {done ? (
        <p className="text-sm font-semibold text-sage-700 dark:text-sage-300">Fatto: ricarico…</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            Svuota i dati della coppia — eventi, liste, note, wishlist, decisioni, promemoria,
            risparmi, tessere, capsule e ciclo — per riprovare i flussi da zero. Account, coppia e
            banca domande restano.
          </p>
          {error && <ErrorBanner message={error} />}
          {open ? (
            <div className="space-y-2">
              <TextInput
                value={confirmText}
                onChange={(changeEvent) => setConfirmText(changeEvent.target.value)}
                placeholder="Scrivi RESET per confermare"
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
                  className="flex-1"
                  loading={busy}
                  disabled={!ready}
                  onClick={() => void handleReset()}
                >
                  Svuota i dati
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
              Svuota i dati della coppia
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

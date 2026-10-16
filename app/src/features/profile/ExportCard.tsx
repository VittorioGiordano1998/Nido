import { useState } from 'react'

import { Button, Card } from '../../ui/components'
import { useToast } from '../../ui/toast'
import { useAuth } from '../auth/AuthProvider'
import { exportAccountData } from './exportData'

/** GDPR export, from the Profile (TASK-GDPR-…-002): a ZIP with the JSON and
 *  the photos, built in the browser and downloaded. */
export function ExportCard() {
  const { session } = useAuth()
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    if (busy) return
    setBusy(true)
    try {
      const result = await exportAccountData(session?.user.email)
      showToast({
        message: `Archivio pronto: ${result.photoCount} foto incluse.`,
        tone: 'success',
      })
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Errore durante l'esportazione.",
        tone: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        I tuoi dati
      </h2>
      <div className="space-y-3">
        <p className="text-xs text-ink-muted">
          Scarica tutto quello che l'account può vedere: eventi, liste, note, ricordi, umori e il
          resto, con le foto, in un archivio ZIP. È anche il tuo backup prima di nuove funzioni.
        </p>
        <Button
          type="button"
          variant="secondary"
          loading={busy}
          onClick={() => void handleExport()}
          className="w-full"
        >
          Esporta i dati (ZIP)
        </Button>
      </div>
    </Card>
  )
}

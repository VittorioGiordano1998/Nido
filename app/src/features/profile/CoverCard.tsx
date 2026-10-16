import { useRef, useState } from 'react'

import { Button, Card, ErrorBanner } from '../../ui/components'
import { ImageIcon } from '../../ui/icons'
import { useToast } from '../../ui/toast'
import { BackdropEditor } from '../lists/BackdropEditor'
import type { Framing } from '../lists/photos'
import { useCoupleHero } from '../coupling/useCoupleHero'

/**
 * Profile card (TASK-HOME-…-002): the Home cover photo — upload, framing with
 * the shared editor, remove. Both partners can change it.
 */
export function CoverCard() {
  const { url, busy, error, uploadPending, saveHero, discardPending, clearHero } = useCoupleHero()
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ path: string; previewUrl: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function handlePicked(file: File) {
    setSaving(true)
    try {
      const path = await uploadPending(file)
      setPending({ path, previewUrl: URL.createObjectURL(file) })
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Errore di caricamento.',
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveFraming(framing: Framing) {
    if (!pending) return
    setSaving(true)
    try {
      await saveHero(pending.path, framing)
      URL.revokeObjectURL(pending.previewUrl)
      setPending(null)
      showToast({ message: 'Copertina aggiornata.', tone: 'success' })
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : 'Errore di salvataggio.',
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEditor() {
    if (!pending) return
    URL.revokeObjectURL(pending.previewUrl)
    void discardPending(pending.path)
    setPending(null)
  }

  async function handleRemove() {
    if (!window.confirm('Rimuovere la copertina? Tornerà il gradiente caldo.')) return
    setSaving(true)
    try {
      await clearHero()
      showToast({ message: 'Copertina rimossa.' })
    } catch (err) {
      showToast({
        message: err instanceof Error ? err.message : "Errore durante l'operazione.",
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Copertina della Home
      </h2>
      <div className="space-y-3">
        <div className="h-24 overflow-hidden rounded-2xl bg-gradient-to-br from-accent-100 via-accent-50 to-sage-100 ring-1 ring-line dark:from-accent-100 dark:via-accent-50 dark:to-surface-soft">
          {url ? (
            <img src={url} alt="Copertina attuale" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-ink-faint">
              <ImageIcon className="h-6 w-6" />
            </span>
          )}
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy || saving}
            onClick={() => fileRef.current?.click()}
            className="px-3.5 py-2 text-xs"
          >
            <ImageIcon className="h-4 w-4" /> {url ? 'Cambia copertina' : 'Aggiungi copertina'}
          </Button>
          {url && (
            <button
              type="button"
              disabled={busy || saving}
              onClick={() => void handleRemove()}
              className="text-xs text-ink-faint transition hover:text-red-500 disabled:opacity-50"
            >
              Rimuovi copertina
            </button>
          )}
        </div>
        <p className="text-xs text-ink-faint">
          La foto compare in cima alla Home per entrambi; potete inquadrarla come preferite.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(changeEvent) => {
            const file = changeEvent.target.files?.[0]
            changeEvent.target.value = ''
            if (file) void handlePicked(file)
          }}
        />
      </div>

      {pending && (
        <BackdropEditor
          title="Inquadra la copertina"
          sample="I vostri giorni insieme"
          url={pending.previewUrl}
          initial={{ x: 50, y: 50, zoom: 1 }}
          busy={saving}
          error={null}
          onSave={(framing) => void handleSaveFraming(framing)}
          onClose={handleCancelEditor}
        />
      )}
    </Card>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'

import { CardListSkeleton } from '../../ui/Skeleton'
import { Button, Card, EmptyState, ErrorBanner } from '../../ui/components'
import { ChevronLeftIcon, CloseIcon, PlusIcon, TrashIcon } from '../../ui/icons'
import { useToast } from '../../ui/toast'
import { LoyaltyBarcode } from './LoyaltyBarcode'
import { LoyaltyEditor, toneClasses } from './LoyaltyEditor'
import { useLoyalty } from './useLoyalty'
import type { LoyaltyCard, LoyaltyInput } from './useLoyalty'

export function LoyaltyPage() {
  const { cards, loading, error, createCard, updateCard, deleteCard, restoreCard } = useLoyalty()
  const { showToast } = useToast()

  const [viewer, setViewer] = useState<LoyaltyCard | null>(null)
  const [editor, setEditor] = useState<{ card: LoyaltyCard | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSave(input: LoyaltyInput) {
    if (!editor) return
    setSaving(true)
    setFormError(null)
    try {
      if (editor.card) await updateCard(editor.card.id, input)
      else await createCard(input)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const deleted = cards.find((card) => card.id === id) ?? null
    setSaving(true)
    setFormError(null)
    try {
      await deleteCard(id)
      setViewer(null)
      setEditor(null)
      if (deleted) {
        showToast({
          message: 'Tessera eliminata.',
          action: { label: 'Annulla', onAction: () => void restoreCard(deleted) },
        })
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Link
            to="/us"
            aria-label="Torna a Noi"
            className="mt-0.5 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-balance text-2xl font-bold text-ink">Tessere</h1>
            <p className="text-sm text-ink-muted">
              Le tessere dei negozi, pronte al banco anche senza rete.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null)
            setEditor({ card: null })
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
        >
          <PlusIcon className="h-4 w-4" /> Nuova
        </button>
      </header>

      {error && <ErrorBanner message={error} />}
      {formError && <ErrorBanner message={formError} />}

      {loading ? (
        <CardListSkeleton rows={3} />
      ) : cards.length === 0 ? (
        <EmptyState
          title="Nessuna tessera"
          description="Aggiungi la prima: numero e formato, e la mostri al banco in un tocco."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {cards.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => setViewer(card)}
                className="w-full text-left"
              >
                <Card className="space-y-1.5 transition hover:ring-accent-300">
                  <span
                    className={`inline-block max-w-full truncate rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses(card.color)}`}
                  >
                    {card.storeName}
                  </span>
                  <span className="block truncate font-mono text-xs text-ink-muted">
                    {card.code}
                  </span>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}

      {viewer && (
        <div
          role="presentation"
          onClick={() => setViewer(null)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-scrim p-6 backdrop-blur-[2px]"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={viewer.storeName}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
            className="w-full max-w-sm space-y-4 rounded-3xl bg-canvas p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-ink">{viewer.storeName}</h2>
              <button
                type="button"
                onClick={() => setViewer(null)}
                aria-label="Chiudi"
                className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink-soft"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex justify-center rounded-2xl bg-white p-4">
              <LoyaltyBarcode code={viewer.code} type={viewer.barcodeType} />
            </div>
            <p className="text-center font-mono text-sm text-ink-soft">{viewer.code}</p>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setFormError(null)
                  setEditor({ card: viewer })
                  setViewer(null)
                }}
              >
                Modifica
              </Button>
              <Button
                variant="ghost"
                disabled={saving}
                onClick={() => void handleDelete(viewer.id)}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
              >
                <TrashIcon className="h-4 w-4" /> Elimina
              </Button>
            </div>
          </div>
        </div>
      )}

      {editor && (
        <LoyaltyEditor
          key={editor.card?.id ?? 'new'}
          card={editor.card}
          saving={saving}
          error={formError}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}

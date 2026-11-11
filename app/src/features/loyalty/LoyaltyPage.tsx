import { useState } from 'react'

import { CardListSkeleton } from '../../ui/Skeleton'
import { Button, Card, EmptyState, ErrorBanner } from '../../ui/components'
import { PlusIcon, TrashIcon } from '../../ui/icons'
import { PageHeader } from '../../ui/PageHeader'
import { Sheet } from '../../ui/Sheet'
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
      <PageHeader
        title="Tessere"
        description="Le tessere dei negozi, pronte al banco anche senza rete."
        backTo="/us"
        backLabel="Torna a Noi"
        action={
          <Button
            size="sm"
            onClick={() => {
              setFormError(null)
              setEditor({ card: null })
            }}
          >
            <PlusIcon className="h-4 w-4" /> Nuova
          </Button>
        }
      />

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
        <ul className="stagger grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => setViewer(card)}
                className="w-full text-left"
              >
                <Card interactive className="space-y-1.5">
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
        <Sheet title={viewer.storeName} size="sm" onClose={() => setViewer(null)}>
          <div className="space-y-4">
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
                variant="danger"
                disabled={saving}
                onClick={() => void handleDelete(viewer.id)}
              >
                <TrashIcon className="h-4 w-4" /> Elimina
              </Button>
            </div>
          </div>
        </Sheet>
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

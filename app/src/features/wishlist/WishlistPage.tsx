import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Card, EmptyState, ErrorBanner, Spinner } from '../../ui/components'
import { CheckIcon, ChevronLeftIcon, PlusIcon } from '../../ui/icons'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { WishlistEditor } from './WishlistEditor'
import { useWishlist } from './useWishlist'
import type { WishInput, WishItem } from './useWishlist'

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(price)
  } catch {
    return `${price.toFixed(2)} ${currency}`
  }
}

export function WishlistPage() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { items, loading, error, createItem, updateItem, togglePurchased, deleteItem } =
    useWishlist()

  const [editor, setEditor] = useState<{ item: WishItem | null } | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const myId = session?.user.id
  const partner = couple?.members.find((member) => member.userId !== myId) ?? null
  const mine = items.filter((item) => item.ownerId === myId)
  const partnerItems = items.filter((item) => item.ownerId !== myId)

  function ownerLabel(item: WishItem): string {
    if (item.purchasedBy === null) return ''
    return item.purchasedBy === myId ? 'da te' : `da ${nameOf(item.purchasedBy)}`
  }

  function nameOf(userId: string): string {
    return couple?.members.find((member) => member.userId === userId)?.displayName ?? '—'
  }

  async function handleSave(input: WishInput) {
    if (!editor) return
    setSaving(true)
    setFormError(null)
    try {
      if (editor.item) await updateItem(editor.item.id, input)
      else await createItem(input)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setSaving(true)
    setFormError(null)
    try {
      await deleteItem(id)
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item: WishItem) {
    try {
      await togglePurchased(item)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore durante il salvataggio.')
    }
  }

  function renderGroup(title: string, list: WishItem[]) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{title}</h2>
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-4 py-6 text-center text-sm text-ink-faint">
            Ancora niente qui.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((item) => (
              <li key={item.id}>
                <Card className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null)
                      setEditor({ item })
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span
                      className={`block truncate text-sm font-semibold ${
                        item.purchased ? 'text-ink-faint line-through' : 'text-ink'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      {item.price !== null ? formatPrice(item.price, item.currency) : 'Senza prezzo'}
                      {item.url ? (
                        <>
                          {' · '}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(clickEvent) => clickEvent.stopPropagation()}
                            className="font-semibold text-accent-ink hover:underline"
                          >
                            link
                          </a>
                        </>
                      ) : null}
                      {item.priority > 0 ? ' · priorità alta' : ''}
                    </span>
                    {item.notes && (
                      <span className="mt-0.5 block truncate text-xs text-ink-faint">
                        {item.notes}
                      </span>
                    )}
                    {item.purchased && (
                      <span className="mt-0.5 block text-xs font-semibold text-sage-700 dark:text-sage-300">
                        Preso {ownerLabel(item)}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={item.purchased ? 'Rimuovi preso' : 'Segna come preso'}
                    onClick={() => void handleToggle(item)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 transition ${
                      item.purchased
                        ? 'bg-sage-500 text-white ring-sage-500'
                        : 'bg-surface text-transparent ring-line-strong hover:text-accent-glyph hover:ring-accent-400'
                    }`}
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                  </button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    )
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
            <h1 className="text-2xl font-bold text-ink">Wishlist</h1>
            <p className="text-sm text-ink-muted">
              I desideri di ognuno, così i regali non sono mai un terno al lotto.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null)
            setEditor({ item: null })
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-accent-700"
        >
          <PlusIcon className="h-4 w-4" /> Aggiungi
        </button>
      </header>

      {error && <ErrorBanner message={error} />}
      {formError && <ErrorBanner message={formError} />}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nessun desiderio"
          description="Aggiungi la prima cosa che ti piacerebbe: il partner saprà cosa cercare."
        />
      ) : (
        <>
          {partner && renderGroup(`I desideri di ${partner.displayName}`, partnerItems)}
          {renderGroup('I tuoi', mine)}
        </>
      )}

      {editor && (
        <WishlistEditor
          key={editor.item?.id ?? 'new'}
          item={editor.item}
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

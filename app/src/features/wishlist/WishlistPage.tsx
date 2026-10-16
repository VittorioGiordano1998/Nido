import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { CardListSkeleton } from '../../ui/Skeleton'
import { formatDateIt, fromDateKey, toDateKey } from '../../core/dates'
import { Card, EmptyState, ErrorBanner } from '../../ui/components'
import { CheckIcon, ChevronLeftIcon, PlusIcon } from '../../ui/icons'
import { useToast } from '../../ui/toast'
import { useAuth } from '../auth/AuthProvider'
import { expandOccurrences } from '../calendar/recurrence'
import { useEvents } from '../calendar/useEvents'
import { useCouple } from '../coupling/CoupleProvider'
import { WishlistEditor } from './WishlistEditor'
import { useWishlist } from './useWishlist'
import type { WishInput, WishItem } from './useWishlist'

const RADAR_DAYS = 31

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(price)
  } catch {
    return `${price.toFixed(2)} ${currency}`
  }
}

function daysLeft(iso: string): number {
  const date = new Date(iso)
  const today = new Date()
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.round((target - now) / 86_400_000))
}

export function WishlistPage() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { items, loading, error, createItem, updateItem, togglePurchased, deleteItem, restoreItem } =
    useWishlist()
  const { events } = useEvents()
  const { showToast } = useToast()

  const [todayKey] = useState(() => toDateKey(new Date()))

  // Gift radar: tagged occasions (birthdays/anniversaries) in the next 30 days,
  // expanded from the calendar, with the right wishes as hints.
  const occasions = useMemo(() => {
    const start = fromDateKey(todayKey)
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + RADAR_DAYS)
    return expandOccurrences(events, start, end)
      .filter((occurrence) => occurrence.event.occasion !== null)
      .slice(0, 6)
  }, [events, todayKey])

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
    const deleted = items.find((item) => item.id === id) ?? null
    setSaving(true)
    setFormError(null)
    try {
      await deleteItem(id)
      setEditor(null)
      if (deleted) {
        showToast({
          message: 'Desiderio eliminato.',
          action: { label: 'Annulla', onAction: () => void restoreItem(deleted) },
        })
      }
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
            <h1 className="text-balance text-2xl font-bold text-ink">Wishlist</h1>
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

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Radar regali
        </h2>
        {occasions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-4 py-4 text-center text-xs text-ink-faint">
            Nessuna occasione nei prossimi 30 giorni: segna compleanni e anniversari nel calendario
            (Occasione speciale) e compariranno qui.
          </p>
        ) : (
          <ul className="space-y-2">
            {occasions.map((occurrence) => {
              const days = daysLeft(occurrence.startAt)
              const occasionName =
                occurrence.event.occasion === 'anniversary' ? 'Anniversario' : 'Compleanno'
              const forWhom = occurrence.event.occasionFor
              const hints = forWhom
                ? items
                    .filter((item) => item.ownerId === forWhom && !item.purchased)
                    .slice(0, 3)
                : []
              return (
                <li key={occurrence.key}>
                  <Card className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {occurrence.event.title}
                        </span>
                        <span className="block text-xs text-ink-muted">
                          {occasionName} · {formatDateIt(occurrence.startAt.slice(0, 10))}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-semibold text-accent-ink">
                        {days <= 0 ? 'oggi' : days === 1 ? 'domani' : `tra ${days} giorni`}
                      </span>
                    </div>
                    {hints.length > 0 && (
                      <p className="text-xs text-ink-muted">
                        <span className="font-semibold text-ink-soft">{nameOf(forWhom ?? '')}</span>{' '}
                        desidera: {hints.map((item) => item.title).join(' · ')}
                      </p>
                    )}
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {loading ? (
        <CardListSkeleton rows={3} />
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

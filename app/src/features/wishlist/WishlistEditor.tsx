import { useEffect, useState } from 'react'

import { Button, ErrorBanner, Field, Select, TextArea, TextInput } from '../../ui/components'
import { CloseIcon, TrashIcon } from '../../ui/icons'
import type { WishInput, WishItem } from './useWishlist'

interface WishlistEditorProps {
  /** Item in modifica; `null` = nuovo desiderio. */
  item: WishItem | null
  saving: boolean
  error: string | null
  onSave: (input: WishInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

interface FormState {
  title: string
  url: string
  price: string
  currency: string
  priority: string
  notes: string
}

const CURRENCIES = ['EUR', 'USD', 'GBP'] as const

function initialState(item: WishItem | null): FormState {
  if (!item) {
    return { title: '', url: '', price: '', currency: 'EUR', priority: '0', notes: '' }
  }
  return {
    title: item.title,
    url: item.url ?? '',
    price: item.price === null ? '' : String(item.price),
    currency: item.currency,
    priority: String(item.priority),
    notes: item.notes ?? '',
  }
}

export function WishlistEditor({
  item,
  saving,
  error,
  onSave,
  onDelete,
  onClose,
}: WishlistEditorProps) {
  const [form, setForm] = useState<FormState>(() => initialState(item))
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit() {
    const title = form.title.trim()
    if (!title) {
      setValidationError('Serve un titolo.')
      return
    }
    const url = form.url.trim() || null
    if (url && !/^https?:\/\//i.test(url)) {
      setValidationError('Il link deve iniziare con http:// o https://')
      return
    }
    const price = form.price.trim() === '' ? null : Number(form.price.replace(',', '.'))
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      setValidationError('Il prezzo non è valido.')
      return
    }
    setValidationError(null)
    await onSave({
      title,
      url,
      price,
      currency: form.currency,
      notes: form.notes.trim() || null,
      priority: Number(form.priority) || 0,
    })
  }

  function handleDelete() {
    if (!item) return
    if (!window.confirm('Eliminare questo desiderio?')) return
    void onDelete(item.id)
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-30 flex items-end justify-center bg-scrim backdrop-blur-[2px] sm:items-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item ? 'Modifica desiderio' : 'Nuovo desiderio'}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            {item ? 'Modifica desiderio' : 'Nuovo desiderio'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-soft hover:text-ink-soft"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4">
          <Field label="Cosa desideri">
            <TextInput
              value={form.title}
              onChange={(changeEvent) => setForm({ ...form, title: changeEvent.target.value })}
              placeholder="Es. Un libro, un giro in barca…"
              autoFocus
            />
          </Field>

          <Field label="Link" hint="Facoltativo.">
            <TextInput
              type="url"
              value={form.url}
              onChange={(changeEvent) => setForm({ ...form, url: changeEvent.target.value })}
              placeholder="https://…"
            />
          </Field>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <Field label="Prezzo" hint="Facoltativo.">
              <TextInput
                type="text"
                inputMode="decimal"
                value={form.price}
                onChange={(changeEvent) => setForm({ ...form, price: changeEvent.target.value })}
                placeholder="Es. 24,90"
              />
            </Field>
            <Field label="Valuta">
              <Select
                value={form.currency}
                onChange={(changeEvent) => setForm({ ...form, currency: changeEvent.target.value })}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Priorità">
            <Select
              value={form.priority}
              onChange={(changeEvent) => setForm({ ...form, priority: changeEvent.target.value })}
            >
              <option value="0">Normale</option>
              <option value="1">Alta</option>
            </Select>
          </Field>

          <Field label="Note" hint="Facoltative: taglia, colore, dettagli.">
            <TextArea
              rows={2}
              value={form.notes}
              onChange={(changeEvent) => setForm({ ...form, notes: changeEvent.target.value })}
            />
          </Field>

          {validationError && <ErrorBanner message={validationError} />}
          {error && <ErrorBanner message={error} />}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              loading={saving}
              onClick={() => void handleSubmit()}
              className="flex-1"
            >
              {item ? 'Salva' : 'Aggiungi'}
            </Button>
            {item && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={saving}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/60"
              >
                <TrashIcon className="h-4 w-4" /> Elimina
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

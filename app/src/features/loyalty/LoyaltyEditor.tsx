import { useEffect, useState } from 'react'

import { Button, ErrorBanner, Field, Select, TextInput } from '../../ui/components'
import { CloseIcon, TrashIcon } from '../../ui/icons'
import type { BarcodeType, LoyaltyCard, LoyaltyInput } from './useLoyalty'

export const CARD_TONES = [
  { id: 'terra', label: 'Terra', classes: 'bg-accent-100 text-accent-ink' },
  {
    id: 'oliva',
    label: 'Oliva',
    classes: 'bg-sage-100 text-sage-700 dark:bg-sage-700/30 dark:text-sage-300',
  },
  { id: 'neutro', label: 'Neutro', classes: 'bg-surface-muted text-ink-soft' },
] as const

export function toneClasses(id: string): string {
  return CARD_TONES.find((tone) => tone.id === id)?.classes ?? CARD_TONES[2].classes
}

interface LoyaltyEditorProps {
  card: LoyaltyCard | null
  saving: boolean
  error: string | null
  onSave: (input: LoyaltyInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

export function LoyaltyEditor({ card, saving, error, onSave, onDelete, onClose }: LoyaltyEditorProps) {
  const [storeName, setStoreName] = useState(card?.storeName ?? '')
  const [code, setCode] = useState(card?.code ?? '')
  const [barcodeType, setBarcodeType] = useState<BarcodeType>(card?.barcodeType ?? 'code128')
  const [color, setColor] = useState(card?.color ?? 'terra')
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit() {
    if (!storeName.trim()) {
      setValidationError('Serve il nome del negozio.')
      return
    }
    if (!code.trim()) {
      setValidationError('Serve il codice della tessera.')
      return
    }
    setValidationError(null)
    await onSave({
      storeName: storeName.trim(),
      code: code.trim(),
      barcodeType,
      color,
    })
  }

  function handleDelete() {
    if (!card) return
    if (!window.confirm('Eliminare questa tessera?')) return
    void onDelete(card.id)
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
        aria-label={card ? 'Modifica tessera' : 'Nuova tessera'}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-canvas p-5 shadow-xl sm:rounded-3xl"
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            {card ? 'Modifica tessera' : 'Nuova tessera'}
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
          <Field label="Negozio">
            <TextInput
              value={storeName}
              onChange={(changeEvent) => setStoreName(changeEvent.target.value)}
              placeholder="Es. Supermercato"
              autoFocus
            />
          </Field>

          <Field label="Codice" hint="Il numero della tessera, come stampato.">
            <TextInput
              value={code}
              onChange={(changeEvent) => setCode(changeEvent.target.value)}
              placeholder="Es. 2012345678901"
            />
          </Field>

          <Field label="Formato">
            <Select
              value={barcodeType}
              onChange={(changeEvent) => setBarcodeType(changeEvent.target.value as BarcodeType)}
            >
              <option value="code128">Codice a barre (Code 128)</option>
              <option value="ean13">Codice a barre (EAN-13)</option>
              <option value="code39">Codice a barre (Code 39)</option>
              <option value="qr">QR</option>
            </Select>
          </Field>

          <Field label="Colore">
            <Select value={color} onChange={(changeEvent) => setColor(changeEvent.target.value)}>
              {CARD_TONES.map((tone) => (
                <option key={tone.id} value={tone.id}>
                  {tone.label}
                </option>
              ))}
            </Select>
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
              {card ? 'Salva' : 'Aggiungi'}
            </Button>
            {card && (
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

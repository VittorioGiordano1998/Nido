import { useState } from 'react'

import { Button, Card, ErrorBanner, TextInput } from '../../ui/components'
import { CloseIcon } from '../../ui/icons'
import { Skeleton } from '../../ui/Skeleton'
import { useToast } from '../../ui/toast'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { STICKY_MAX_LENGTH, useStickies } from './useStickies'
import type { Sticky } from './useStickies'

const TILTS = [-1.2, 0.9, -0.6, 1.4]

/**
 * Home card "Bigliettini" (TASK-STICK-…-001): a one-line composer and the
 * sticky notes of the couple. The recipient dismisses (with undo); the author
 * can retract. Slight per-note rotation for the sticky feel.
 */
export function StickyCard() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { received, sent, loading, error, send, dismiss, restore } = useStickies()
  const { showToast } = useToast()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const myId = session?.user.id
  const partner = couple?.members.find((member) => member.userId !== myId)

  if (!partner) return null

  async function handleSend() {
    if (!draft.trim() || sending) return
    setSending(true)
    setFormError(null)
    try {
      await send(draft)
      setDraft('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di invio.')
    } finally {
      setSending(false)
    }
  }

  async function handleDismiss(sticky: Sticky, mine: boolean) {
    try {
      await dismiss(sticky.id)
      showToast({
        message: mine ? 'Bigliettino ritirato.' : 'Bigliettino tolto.',
        action: { label: 'Annulla', onAction: () => void restore(sticky) },
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'operazione.")
    }
  }

  if (loading) {
    return (
      <section className="space-y-2" aria-hidden="true">
        <Skeleton className="h-4 w-28" />
        <div className="rounded-3xl bg-surface/60 p-4 ring-1 ring-line/50">
          <Skeleton className="h-9" />
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Bigliettini
      </h2>

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <TextInput
            value={draft}
            onChange={(changeEvent) => setDraft(changeEvent.target.value)}
            onKeyDown={(keyEvent) => {
              if (keyEvent.key === 'Enter') void handleSend()
            }}
            placeholder={`Un pensiero per ${partner.displayName}…`}
            maxLength={STICKY_MAX_LENGTH}
            disabled={sending}
            aria-label="Scrivi un bigliettino"
            className="px-3 py-2 text-sm"
          />
          <Button
            type="button"
            onClick={() => void handleSend()}
            loading={sending}
            disabled={!draft.trim()}
            className="shrink-0 px-3.5 py-2 text-xs"
          >
            Lascia
          </Button>
        </div>

        {received.length > 0 && (
          <ul className="space-y-2">
            {received.map((sticky, index) => (
              <li
                key={sticky.id}
                style={{ transform: `rotate(${TILTS[index % TILTS.length]}deg)` }}
                className="flex items-start gap-2 rounded-xl bg-accent-100/80 px-3 py-2.5 ring-1 ring-accent-200/70 dark:bg-accent-100/40 dark:ring-accent-200/40"
              >
                <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-ink">
                  {sticky.body}
                </p>
                <button
                  type="button"
                  aria-label="Togli il bigliettino"
                  title="Togli"
                  onClick={() => void handleDismiss(sticky, false)}
                  className="shrink-0 rounded-lg p-1 text-ink-muted transition hover:bg-surface/70 hover:text-ink"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {received.length === 0 && sent.length === 0 && (
          <p className="text-xs text-ink-muted">
            Nessun bigliettino: lasciane uno e comparirà sulla Home di {partner.displayName}.
          </p>
        )}

        {sent.length > 0 && (
          <details className="text-xs text-ink-muted">
            <summary className="cursor-pointer font-semibold text-ink-soft">
              Inviati ({sent.length})
            </summary>
            <ul className="mt-2 space-y-1.5">
              {sent.map((sticky) => (
                <li key={sticky.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">«{sticky.body}»</span>
                  <button
                    type="button"
                    aria-label="Ritira il bigliettino"
                    title="Ritira"
                    onClick={() => void handleDismiss(sticky, true)}
                    className="shrink-0 rounded-lg p-1 transition hover:bg-surface-soft hover:text-ink"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}

        {(formError || error) && <ErrorBanner message={formError ?? error ?? ''} />}
      </Card>
    </section>
  )
}

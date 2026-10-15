import { useState } from 'react'

import { Button, Card, ErrorBanner } from '../../ui/components'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { NUDGE_MESSAGES, useNudges } from './useNudges'

const nudgeTime = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * One-tap partner nudge + the recent nudges list, both on the "Noi" hub. The
 * push delivery is the `send-push` webhook's job; the list is the fallback
 * that keeps the record useful on every device.
 */
export function NudgeCard() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { nudges, sendNudge } = useNudges()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const myId = session?.user.id
  const partner = couple?.members.find((member) => member.userId !== myId) ?? null

  function nameOf(userId: string): string {
    return couple?.members.find((member) => member.userId === userId)?.displayName ?? '—'
  }

  async function handleSend() {
    if (!partner || busy) return
    setBusy(true)
    setError(null)
    try {
      const message = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)]
      await sendNudge(partner.userId, { message })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore invio promemoria.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-3">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-ink">Promemoria al partner</p>
        <p className="text-xs text-ink-muted">
          {partner
            ? 'Un tocco: al partner arriva la notifica, con un messaggio giocoso.'
            : 'Invita prima il partner per usare i promemoria.'}
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <Button
        onClick={() => void handleSend()}
        loading={busy}
        disabled={!partner}
        className="w-full"
      >
        Ti ricordo io 💛
      </Button>

      {nudges.length > 0 && (
        <ul className="space-y-1 border-t border-line pt-3">
          {nudges.slice(0, 4).map((nudge) => (
            <li key={nudge.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate text-ink-muted">
                <span className="font-semibold text-ink-soft">
                  {nudge.fromUser === myId ? 'Tu' : nameOf(nudge.fromUser)}:
                </span>{' '}
                {nudge.message ?? 'Ti ricordo io 💛'}
              </span>
              <span className="shrink-0 text-ink-faint">
                {nudgeTime.format(new Date(nudge.createdAt))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

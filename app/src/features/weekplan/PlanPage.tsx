import { useState } from 'react'
import { Link } from 'react-router-dom'

import { CardListSkeleton } from '../../ui/Skeleton'
import { formatDateIt } from '../../core/dates'
import { Button, Card, ErrorBanner, TextArea } from '../../ui/components'
import { CheckIcon, ChevronLeftIcon, CloseIcon } from '../../ui/icons'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { currentWeekStart, useWeekPlan } from './useWeekPlan'
import type { WeekPlanStatus } from './useWeekPlan'

const STATUS_LABEL: Record<WeekPlanStatus, string> = {
  pending: 'in attesa',
  accepted: 'accettata',
  declined: 'rifiutata',
  replaced: 'sostituita',
}

function chipClasses(status: WeekPlanStatus): string {
  if (status === 'accepted') {
    return 'bg-sage-100 text-sage-700 dark:bg-sage-700/30 dark:text-sage-300'
  }
  if (status === 'pending') return 'bg-accent-100 text-accent-ink'
  return 'bg-surface-soft text-ink-muted'
}

export function PlanPage() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { plans, loading, error, propose, setStatus, replace } = useWeekPlan()

  const [draft, setDraft] = useState('')
  const [alternative, setAlternative] = useState('')
  const [showAlternative, setShowAlternative] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const myId = session?.user.id
  const weekStart = currentWeekStart()
  const current = plans.filter((plan) => plan.weekStart === weekStart)
  const active =
    current.find((plan) => plan.status === 'pending') ??
    current.find((plan) => plan.status === 'accepted') ??
    current.find((plan) => plan.status === 'declined') ??
    null
  const replacedOnes = current.filter((plan) => plan.status === 'replaced')
  const history = plans.filter((plan) => plan.weekStart !== weekStart)
  const partnerName =
    couple?.members.find((member) => member.userId !== myId)?.displayName ?? 'il partner'

  function nameOf(userId: string): string {
    return couple?.members.find((member) => member.userId === userId)?.displayName ?? '—'
  }

  async function handlePropose() {
    const proposal = draft.trim()
    if (!proposal) return
    setSaving(true)
    setFormError(null)
    try {
      await propose(proposal)
      setDraft('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatus(id: string, status: 'accepted' | 'declined') {
    setSaving(true)
    setFormError(null)
    try {
      await setStatus(id, status)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleReplace(id: string) {
    const proposal = alternative.trim()
    if (!proposal) return
    setSaving(true)
    setFormError(null)
    try {
      await replace(id, proposal)
      setAlternative('')
      setShowAlternative(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  const proposeForm = (
    <Card className="space-y-3">
      <p className="text-sm font-semibold text-ink">Qualcosa da fare insieme?</p>
      <TextArea
        rows={2}
        value={draft}
        onChange={(changeEvent) => setDraft(changeEvent.target.value)}
        placeholder="Es. Sabato mercato e pranzo fuori"
      />
      <Button
        onClick={() => void handlePropose()}
        loading={saving}
        disabled={!draft.trim()}
        className="w-full"
      >
        Proponi
      </Button>
    </Card>
  )

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-start gap-2">
        <Link
          to="/us"
          aria-label="Torna a Noi"
          className="mt-0.5 rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-soft"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-balance text-2xl font-bold text-ink">Piano settimanale</h1>
          <p className="text-sm text-ink-muted">
            Una proposta a settimana da fare insieme, da accettare o rilanciare.
          </p>
        </div>
      </header>

      {error && <ErrorBanner message={error} />}
      {formError && <ErrorBanner message={formError} />}

      {loading ? (
        <CardListSkeleton rows={2} />
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Questa settimana
            </h2>

            {active === null ? (
              proposeForm
            ) : (
              <Card className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{active.proposal}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${chipClasses(active.status)}`}
                  >
                    {active.status === 'accepted' ? 'in programma' : STATUS_LABEL[active.status]}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  Proposta di {active.createdBy === myId ? 'te' : nameOf(active.createdBy)}
                </p>

                {active.status === 'pending' &&
                  (active.createdBy === myId ? (
                    <p className="text-xs text-ink-faint">In attesa di {partnerName}…</p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleStatus(active.id, 'accepted')}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-accent-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-accent-700 disabled:opacity-50"
                      >
                        <CheckIcon className="h-4 w-4" /> Accetta
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleStatus(active.id, 'declined')}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-surface px-3.5 py-2 text-xs font-semibold text-ink-soft ring-1 ring-line transition hover:bg-surface-soft disabled:opacity-50"
                      >
                        <CloseIcon className="h-4 w-4" /> Rifiuta
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAlternative((value) => !value)}
                        disabled={saving}
                        className="rounded-xl px-3.5 py-2 text-xs font-semibold text-accent-ink transition hover:bg-accent-50 disabled:opacity-50"
                      >
                        Alternativa
                      </button>
                    </div>
                  ))}

                {active.status === 'accepted' && (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-sage-700 dark:text-sage-300">
                    <CheckIcon className="h-3.5 w-3.5" /> Buona settimana, insieme.
                  </p>
                )}

                {active.status === 'declined' && (
                  <p className="text-xs text-ink-faint">Rifiutata: provate con un'altra idea.</p>
                )}

                {showAlternative && active.status === 'pending' && active.createdBy !== myId && (
                  <div className="space-y-2 border-t border-line pt-3">
                    <TextArea
                      rows={2}
                      value={alternative}
                      onChange={(changeEvent) => setAlternative(changeEvent.target.value)}
                      placeholder="La tua alternativa"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => void handleReplace(active.id)}
                      loading={saving}
                      disabled={!alternative.trim()}
                      className="w-full"
                    >
                      Proponi alternativa
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {replacedOnes.length > 0 && (
              <ul className="space-y-1 px-1">
                {replacedOnes.map((plan) => (
                  <li key={plan.id} className="truncate text-xs text-ink-faint line-through">
                    {plan.proposal}
                  </li>
                ))}
              </ul>
            )}

            {active?.status === 'declined' && proposeForm}
          </section>

          {history.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                Le settimane passate
              </h2>
              <ul className="space-y-2">
                {history.map((plan) => (
                  <li key={plan.id}>
                    <Card className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{plan.proposal}</p>
                        <p className="text-xs text-ink-muted">
                          Settimana del {formatDateIt(plan.weekStart)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${chipClasses(plan.status)}`}
                      >
                        {STATUS_LABEL[plan.status]}
                      </span>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}

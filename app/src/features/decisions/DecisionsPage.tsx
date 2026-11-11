import { useState } from 'react'

import { CardListSkeleton } from '../../ui/Skeleton'
import { formatDateIt } from '../../core/dates'
import { Button, Card, EmptyState, ErrorBanner } from '../../ui/components'
import { CheckIcon, PlusIcon, TrashIcon } from '../../ui/icons'
import { PageHeader } from '../../ui/PageHeader'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { DecisionEditor } from './DecisionEditor'
import { useDecisions } from './useDecisions'
import type { DecisionVote } from './useDecisions'

export function DecisionsPage() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { decisions, votes, loading, error, createDecision, vote, reveal, deleteDecision } =
    useDecisions()

  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const myId = session?.user.id

  function nameOf(userId: string): string {
    return couple?.members.find((member) => member.userId === userId)?.displayName ?? '—'
  }

  async function handleCreate(question: string, options: string[]) {
    setSaving(true)
    setFormError(null)
    try {
      await createDecision(question, options)
      setEditorOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  async function handleVote(decisionId: string, choice: string) {
    try {
      await vote(decisionId, choice)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore durante il voto.')
    }
  }

  async function handleReveal(decisionId: string) {
    const confirmed = window.confirm(
      'Rivelare adesso? Se il partner non ha ancora votato, il suo voto resterà vuoto e non potrà più votare.',
    )
    if (!confirmed) return
    try {
      await reveal(decisionId)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore durante il reveal.')
    }
  }

  async function handleDelete(decisionId: string) {
    if (!window.confirm('Eliminare questa decisione (e i voti)?')) return
    try {
      await deleteDecision(decisionId)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Errore durante l'eliminazione.")
    }
  }

  return (
    <div className="space-y-5 pt-2">
      <PageHeader
        title="Decisioni alla cieca"
        description="Votate di nascosto, poi rivelate e scoprite se siete d'accordo."
        backTo="/us"
        backLabel="Torna a Noi"
        action={
          <Button
            size="sm"
            onClick={() => {
              setFormError(null)
              setEditorOpen(true)
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
      ) : decisions.length === 0 ? (
        <EmptyState
          title="Nessuna decisione"
          description="Crea la prima: una domanda e due o più opzioni, da votare in segreto."
        />
      ) : (
        <ul className="grid grid-cols-1 items-start gap-2.5 lg:grid-cols-2">
          {decisions.map((decision) => {
            const revealed = decision.revealedAt !== null
            const allVotes: DecisionVote[] = votes.filter(
              (entry) => entry.decisionId === decision.id,
            )
            const myVote = allVotes.find((entry) => entry.userId === myId) ?? null
            const agreed =
              revealed &&
              allVotes.length >= 2 &&
              new Set(allVotes.map((entry) => entry.choice)).size === 1

            return (
              <li key={decision.id}>
                <Card className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-ink">{decision.question}</p>
                      <p className="text-xs text-ink-faint">
                        {nameOf(decision.createdBy)} ·{' '}
                        {formatDateIt(decision.createdAt.slice(0, 10))}
                        {revealed ? ' · rivelata' : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Elimina decisione"
                      onClick={() => void handleDelete(decision.id)}
                      className="rounded-lg p-1.5 text-ink-faint transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {!revealed && myVote === null && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {decision.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => void handleVote(decision.id, option)}
                            className="rounded-xl bg-surface px-4 py-2 text-sm font-semibold text-ink-soft ring-1 ring-line transition hover:bg-surface-soft"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-ink-faint">
                        La tua scelta resta segreta finché non rivelate.
                      </p>
                    </div>
                  )}

                  {!revealed && myVote !== null && (
                    <div className="space-y-2">
                      <p className="text-sm text-ink-soft">
                        Il tuo voto:{' '}
                        <strong className="font-semibold text-ink">{myVote.choice}</strong>
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-ink-faint">
                          In attesa del reveal: il voto del partner resta segreto.
                        </p>
                        <button
                          type="button"
                          onClick={() => void handleReveal(decision.id)}
                          className="shrink-0 rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-ink-soft ring-1 ring-line transition hover:bg-surface-soft"
                        >
                          Rivela
                        </button>
                      </div>
                    </div>
                  )}

                  {revealed && (
                    <div className="space-y-2">
                      {couple?.members.map((member) => {
                        const memberVote = allVotes.find((entry) => entry.userId === member.userId)
                        const isMine = member.userId === myId
                        return (
                          <div
                            key={member.userId}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="text-ink-soft">
                              {isMine ? 'Tu' : member.displayName}
                            </span>
                            {memberVote ? (
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  agreed
                                    ? 'bg-sage-100 text-sage-700 dark:bg-sage-700/30 dark:text-sage-300'
                                    : 'bg-surface-soft text-ink-soft'
                                }`}
                              >
                                {memberVote.choice}
                              </span>
                            ) : (
                              <span className="text-xs text-ink-faint">non ha votato</span>
                            )}
                          </div>
                        )
                      })}
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
                        {agreed ? (
                          <>
                            <CheckIcon className="h-3.5 w-3.5 text-sage-700 dark:text-sage-300" />
                            Siete d'accordo: {allVotes[0]?.choice}
                          </>
                        ) : (
                          'Voti diversi: decidete voi, o riprovate.'
                        )}
                      </p>
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      {editorOpen && (
        <DecisionEditor
          saving={saving}
          error={formError}
          onSave={handleCreate}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  )
}

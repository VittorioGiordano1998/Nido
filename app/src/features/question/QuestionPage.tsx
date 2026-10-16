import { useState } from 'react'
import { Link } from 'react-router-dom'

import { CardListSkeleton } from '../../ui/Skeleton'
import { formatDateIt } from '../../core/dates'
import { Button, Card, EmptyState, ErrorBanner, TextArea } from '../../ui/components'
import { ChevronLeftIcon } from '../../ui/icons'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { useDailyQuestion } from './useDailyQuestion'

export function QuestionPage() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { question, answers, history, streak, loading, error, answerToday, myAnswer, bothAnswered } =
    useDailyQuestion()
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const myId = session?.user.id
  const partnerName =
    couple?.members.find((member) => member.userId !== myId)?.displayName ?? 'il partner'

  function nameOf(userId: string): string {
    return couple?.members.find((member) => member.userId === userId)?.displayName ?? '—'
  }

  async function handleAnswer() {
    const value = draft.trim()
    if (!value) return
    setSaving(true)
    setFormError(null)
    try {
      await answerToday(value)
      setDraft('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setSaving(false)
    }
  }

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
          <h1 className="text-balance text-2xl font-bold text-ink">Domanda del giorno</h1>
          <p className="text-sm text-ink-muted">
            Rispondete in segreto: le risposte si svelano quando ci siete tutti e due.
          </p>
        </div>
      </header>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <CardListSkeleton rows={2} />
      ) : question === null ? (
        <EmptyState
          title="Banca domande vuota"
          description="Manca il seed: applica supabase/apply-question-bank.sql al progetto Supabase e torna qui."
        />
      ) : (
        <>
          <Card className="space-y-3">
            {question.category && (
              <span className="inline-block rounded-full bg-accent-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-ink">
                {question.category}
              </span>
            )}
            <p className="text-lg font-semibold text-ink">{question.text}</p>

            {myAnswer === null ? (
              <div className="space-y-3 pt-1">
                <TextArea
                  rows={3}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="La tua risposta…"
                />
                {formError && <ErrorBanner message={formError} />}
                <Button
                  onClick={() => void handleAnswer()}
                  loading={saving}
                  disabled={!draft.trim()}
                  className="w-full"
                >
                  Rispondi
                </Button>
              </div>
            ) : bothAnswered ? (
              <div className="space-y-2 pt-1">
                {answers.map((entry) => (
                  <div
                    key={entry.userId}
                    className={`rounded-xl px-3.5 py-2.5 ${
                      entry.userId === myId ? 'bg-accent-50' : 'bg-sage-100/70 dark:bg-sage-700/30'
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      {nameOf(entry.userId)}
                    </p>
                    <p className="text-sm text-ink">{entry.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="rounded-xl bg-accent-50 px-3.5 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    La tua risposta
                  </p>
                  <p className="text-sm text-ink">{myAnswer.answer}</p>
                </div>
                <p className="text-xs text-ink-muted">
                  In attesa di {partnerName}… la risposta si svelerà da sola.
                </p>
              </div>
            )}
          </Card>

          <Card className="flex items-center gap-4 bg-sage-100/70 ring-sage-300 dark:bg-sage-700/30 dark:ring-sage-700">
            <p className="text-3xl font-bold text-sage-700 dark:text-sage-300">{streak}</p>
            <div>
              <p className="text-sm font-semibold text-ink">
                {streak === 1 ? 'giorno di fila' : 'giorni di fila'}
              </p>
              <p className="text-xs text-ink-muted">Giorni in cui avete risposto entrambi.</p>
            </div>
          </Card>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Archivio
            </h2>
            {history.length === 0 ? (
              <EmptyState
                title="Ancora niente archivio"
                description="Le risposte svelate dei giorni scorsi compariranno qui."
              />
            ) : (
              <ul className="space-y-2">
                {history.map((entry) => (
                  <li key={entry.date}>
                    <Card>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                        {formatDateIt(entry.date)}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-ink">
                        {entry.question}
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {entry.answers.map((answer) => (
                          <p key={answer.userId} className="text-sm text-ink-soft">
                            <span className="font-semibold">{nameOf(answer.userId)}:</span>{' '}
                            {answer.answer}
                          </p>
                        ))}
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

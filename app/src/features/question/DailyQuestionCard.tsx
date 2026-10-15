import { Link } from 'react-router-dom'

import { Card, Spinner } from '../../ui/components'
import { ChevronRightIcon } from '../../ui/icons'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { useDailyQuestion } from './useDailyQuestion'

/**
 * Compact "question of the day" card for Home. It reuses the hub's hook
 * (useDailyQuestion), so the two surfaces never disagree and the state stays
 * realtime; the card is the deferral from TASK-QOT-VITTORIOGIORDANOYBQ-001
 * picked up by TASK-QOT-VITTORIOGIORDANOYBQ-002.
 */
export function DailyQuestionCard() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const { question, answers, myAnswer, bothAnswered, streak, loading } = useDailyQuestion()

  const myId = session?.user.id
  const partnerName =
    couple?.members.find((member) => member.userId !== myId)?.displayName ?? 'il partner'

  function nameOf(userId: string): string {
    return couple?.members.find((member) => member.userId === userId)?.displayName ?? '—'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-2">
        <Spinner />
      </div>
    )
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
          Domanda del giorno
        </h2>
        <Link to="/us/question" className="text-xs font-semibold text-accent-ink hover:underline">
          Noi
        </Link>
      </div>

      {question === null ? (
        <Card className="space-y-1 bg-surface/60">
          <p className="text-sm font-semibold text-ink-muted">Banca domande vuota</p>
          <p className="text-xs text-ink-faint">
            Applica supabase/apply-question-bank.sql al progetto Supabase.
          </p>
        </Card>
      ) : (
        <Link to="/us/question" className="block">
          <Card className="space-y-2 transition hover:ring-accent-300">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-ink">{question.text}</p>
              {streak > 0 && (
                <span className="shrink-0 rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-semibold text-sage-700 dark:bg-sage-700/30 dark:text-sage-300">
                  {streak} {streak === 1 ? 'giorno' : 'giorni'}
                </span>
              )}
            </div>

            {myAnswer === null ? (
              <span className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                Tocca per rispondere: le risposte si svelano insieme.
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint" />
              </span>
            ) : bothAnswered ? (
              <span className="block space-y-1">
                {answers.map((entry) => (
                  <span key={entry.userId} className="block truncate text-xs text-ink-muted">
                    <strong className="font-semibold text-ink-soft">
                      {nameOf(entry.userId)}:
                    </strong>{' '}
                    {entry.answer}
                  </span>
                ))}
              </span>
            ) : (
              <span className="block space-y-1">
                <span className="block truncate text-xs text-ink-muted">
                  La tua risposta: {myAnswer.answer}
                </span>
                <span className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                  In attesa di {partnerName}… si svelerà da sola.
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint" />
                </span>
              </span>
            )}
          </Card>
        </Link>
      )}
    </section>
  )
}

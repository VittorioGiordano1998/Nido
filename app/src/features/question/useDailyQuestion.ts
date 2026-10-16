import { useCallback, useEffect, useState } from 'react'

import { fromDateKey, toDateKey } from '../../core/dates'
import { uniqueChannelTopic } from '../../core/realtime'
import { subscribeToAppResync } from '../../core/resync'
import { streakFromDates } from '../../core/streaks'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'
import { pickQuestionIndex } from './pick'

export interface DailyQuestion {
  id: number
  text: string
  category: string | null
}

export interface DailyAnswer {
  userId: string
  answer: string
  answeredAt: string
}

export interface HistoryEntry {
  date: string
  question: string
  answers: DailyAnswer[]
}

interface BankRow {
  id: number
  text: string
  category: string | null
}

interface AnswerRow {
  answer_date: string
  user_id: string
  answer: string
  answered_at: string
  question_id: number
}

/** FNV-1a: selezione deterministica stabile di coppia + giorno (vedi pick.ts). */
function addDays(dateKey: string, delta: number): string {
  const date = fromDateKey(dateKey)
  date.setDate(date.getDate() + delta)
  return toDateKey(date)
}

const HISTORY_DAYS = 30

/**
 * Domanda del giorno (state layer): selezione deterministica sulla banca
 * domande, risposte di oggi (nascoste da RLS finché non rispondete entrambi),
 * streak e archivio visibile. Realtime su `daily_answers`.
 */
export function useDailyQuestion() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null
  const [todayKey] = useState(() => toDateKey(new Date()))

  const [question, setQuestion] = useState<DailyQuestion | null>(null)
  const [answers, setAnswers] = useState<DailyAnswer[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setLoading(false)
      return
    }
    setLoading(true)

    const { count, error: countError } = await supabase
      .from('question_bank')
      .select('id', { count: 'exact', head: true })
      .eq('lang', 'it')
    if (countError) {
      setError(countError.message)
      setLoading(false)
      return
    }

    let picked: DailyQuestion | null = null
    if (count && count > 0) {
      const index = pickQuestionIndex(coupleId, todayKey, count)
      const { data } = await supabase
        .from('question_bank')
        .select('id, text, category')
        .eq('lang', 'it')
        .order('id', { ascending: true })
        .range(index, index)
      const row = (data ?? [])[0] as BankRow | undefined
      picked = row ? { id: row.id, text: row.text, category: row.category } : null
    }
    setQuestion(picked)

    const { data: todayRows, error: todayError } = await supabase
      .from('daily_answers')
      .select('user_id, answer, answered_at, question_id, answer_date')
      .eq('couple_id', coupleId)
      .eq('answer_date', todayKey)
    if (todayError) {
      setError(todayError.message)
    } else {
      setAnswers(
        ((todayRows ?? []) as unknown as AnswerRow[]).map((row) => ({
          userId: row.user_id,
          answer: row.answer,
          answeredAt: row.answered_at,
        })),
      )
      setError(null)
    }

    // Storico: la RLS mostra le mie risposte e i giorni in cui hanno risposto entrambi.
    const since = addDays(todayKey, -(HISTORY_DAYS - 1))
    const { data: historyRows } = await supabase
      .from('daily_answers')
      .select('answer_date, user_id, answer, answered_at, question_id')
      .eq('couple_id', coupleId)
      .gte('answer_date', since)
      .order('answer_date', { ascending: false })

    const byDate = new Map<string, AnswerRow[]>()
    for (const row of (historyRows ?? []) as unknown as AnswerRow[]) {
      const list = byDate.get(row.answer_date) ?? []
      list.push(row)
      byDate.set(row.answer_date, list)
    }

    const completeDates = [...byDate.entries()].filter(
      ([, rows]) => new Set(rows.map((row) => row.user_id)).size >= 2,
    )
    const questionIds = [...new Set(completeDates.flatMap(([, rows]) => rows.map((row) => row.question_id)))]
    let questionText = new Map<number, string>()
    if (questionIds.length > 0) {
      const { data: bankRows } = await supabase
        .from('question_bank')
        .select('id, text')
        .in('id', questionIds)
      questionText = new Map(
        ((bankRows ?? []) as Array<{ id: number; text: string }>).map((row) => [row.id, row.text]),
      )
    }

    setHistory(
      completeDates
        .filter(([date]) => date !== todayKey)
        .map(([date, rows]) => ({
          date,
          question: questionText.get(rows[0]?.question_id ?? -1) ?? '',
          answers: rows.map((row) => ({
            userId: row.user_id,
            answer: row.answer,
            answeredAt: row.answered_at,
          })),
        })),
    )

    const completeSet = new Set(completeDates.map(([date]) => date))
    setStreak(streakFromDates(completeSet, todayKey))

    setLoading(false)
  }, [coupleId, todayKey])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Silent resync when the app comes back to the foreground (TASK-ROB-…-002).
  useEffect(() => subscribeToAppResync(() => void refresh()), [refresh])

  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(uniqueChannelTopic(`question-${coupleId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_answers', filter: `couple_id=eq.${coupleId}` },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId, refresh])

  const answerToday = useCallback(
    async (answer: string) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      if (question === null) throw new Error('Nessuna domanda disponibile.')
      const { error: insertError } = await supabase.from('daily_answers').insert({
        couple_id: coupleId,
        question_id: question.id,
        answer_date: todayKey,
        user_id: userId,
        answer,
      })
      if (insertError) throw new Error(insertError.message)
      await refresh()
    },
    [coupleId, userId, question, todayKey, refresh],
  )

  const myAnswer = userId ? (answers.find((entry) => entry.userId === userId) ?? null) : null
  const bothAnswered = answers.length >= 2

  return { question, answers, history, streak, loading, error, answerToday, myAnswer, bothAnswered }
}

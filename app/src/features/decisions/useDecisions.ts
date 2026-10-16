import { useCallback, useEffect, useState } from 'react'

import { subscribeToAppResync } from '../../core/resync'
import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Blind decisions (state layer): a question with 2-4 options, one hidden vote
 * per partner, a voluntary reveal. The RLS shows my vote always and the
 * partner's only once `revealed_at` is set, so the hook never needs to hide
 * anything itself.
 */

export interface Decision {
  id: string
  coupleId: string
  question: string
  options: string[]
  createdBy: string
  createdAt: string
  revealedAt: string | null
}

export interface DecisionVote {
  decisionId: string
  userId: string
  choice: string
  votedAt: string
}

interface DecisionRow {
  id: string
  couple_id: string
  question: string
  options: unknown
  created_by: string
  created_at: string
  revealed_at: string | null
}

interface VoteRow {
  decision_id: string
  user_id: string
  choice: unknown
  voted_at: string
}

const DECISION_COLUMNS = 'id, couple_id, question, options, created_by, created_at, revealed_at'

function asOptions(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function asChoice(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function rowToDecision(row: DecisionRow): Decision {
  return {
    id: row.id,
    coupleId: row.couple_id,
    question: row.question,
    options: asOptions(row.options),
    createdBy: row.created_by,
    createdAt: row.created_at,
    revealedAt: row.revealed_at,
  }
}

export function useDecisions() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [decisions, setDecisions] = useState<Decision[]>([])
  const [votes, setVotes] = useState<DecisionVote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setDecisions([])
      setVotes([])
      setLoading(false)
      return
    }
    setLoading(true)

    const { data: decisionRows, error: decisionsError } = await supabase
      .from('decisions')
      .select(DECISION_COLUMNS)
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (decisionsError) {
      setError(decisionsError.message)
      setLoading(false)
      return
    }

    const { data: voteRows, error: votesError } = await supabase
      .from('decision_votes')
      .select('decision_id, user_id, choice, voted_at')
    if (votesError) {
      setError(votesError.message)
    } else {
      setError(null)
    }

    setDecisions(((decisionRows ?? []) as unknown as DecisionRow[]).map(rowToDecision))
    setVotes(
      ((voteRows ?? []) as unknown as VoteRow[]).map((row) => ({
        decisionId: row.decision_id,
        userId: row.user_id,
        choice: asChoice(row.choice),
        votedAt: row.voted_at,
      })),
    )
    setLoading(false)
  }, [coupleId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Silent resync when the app comes back to the foreground (TASK-ROB-…-002).
  useEffect(() => subscribeToAppResync(() => void refresh()), [refresh])

  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(uniqueChannelTopic(`decisions-${coupleId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'decisions', filter: `couple_id=eq.${coupleId}` },
        () => {
          void refresh()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'decision_votes' },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId, refresh])

  const createDecision = useCallback(
    async (question: string, options: string[]) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('decisions')
        .insert({ couple_id: coupleId, created_by: userId, question, options })
        .select(DECISION_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setDecisions((current) => [rowToDecision(data as unknown as DecisionRow), ...current])
    },
    [coupleId, userId],
  )

  const vote = useCallback(
    async (decisionId: string, choice: string) => {
      if (!userId) throw new Error('Sessione non ancora caricata.')
      const { error: voteError } = await supabase
        .from('decision_votes')
        .upsert(
          { decision_id: decisionId, user_id: userId, choice },
          { onConflict: 'decision_id,user_id' },
        )
      if (voteError) throw new Error(voteError.message)
      await refresh()
    },
    [userId, refresh],
  )

  const reveal = useCallback(
    async (decisionId: string) => {
      const { error: revealError } = await supabase
        .from('decisions')
        .update({ revealed_at: new Date().toISOString() })
        .eq('id', decisionId)
      if (revealError) throw new Error(revealError.message)
      await refresh()
    },
    [refresh],
  )

  const deleteDecision = useCallback(async (decisionId: string) => {
    const { error: deleteError } = await supabase.from('decisions').delete().eq('id', decisionId)
    if (deleteError) throw new Error(deleteError.message)
    setDecisions((current) => current.filter((decision) => decision.id !== decisionId))
    setVotes((current) => current.filter((entry) => entry.decisionId !== decisionId))
  }, [])

  return { decisions, votes, loading, error, refresh, createDecision, vote, reveal, deleteDecision }
}

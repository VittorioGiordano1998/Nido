import { useCallback, useEffect, useState } from 'react'

import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Savings projects (state layer): couple-shared goals with a progress bar,
 * Realtime on `savings_projects`.
 */

export interface SavingsProject {
  id: string
  coupleId: string
  title: string
  targetAmount: number
  currentAmount: number
  currency: string
  deadline: string | null
  createdAt: string
}

export interface SavingsInput {
  title: string
  targetAmount: number
  currentAmount: number
  currency: string
  deadline: string | null
}

interface SavingsRow {
  id: string
  couple_id: string
  title: string
  target_amount: number | string
  current_amount: number | string
  currency: string | null
  deadline: string | null
  created_at: string
}

const SAVINGS_COLUMNS =
  'id, couple_id, title, target_amount, current_amount, currency, deadline, created_at'

function rowToProject(row: SavingsRow): SavingsProject {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    currency: row.currency ?? 'EUR',
    deadline: row.deadline,
    createdAt: row.created_at,
  }
}

export function useSavings() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [projects, setProjects] = useState<SavingsProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setProjects([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('savings_projects')
      .select(SAVINGS_COLUMNS)
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
    if (loadError) {
      setError(loadError.message)
    } else {
      setProjects(((data ?? []) as unknown as SavingsRow[]).map(rowToProject))
      setError(null)
    }
    setLoading(false)
  }, [coupleId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(uniqueChannelTopic(`savings-${coupleId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_projects',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId, refresh])

  const createProject = useCallback(
    async (input: SavingsInput) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('savings_projects')
        .insert({
          couple_id: coupleId,
          created_by: userId,
          title: input.title,
          target_amount: input.targetAmount,
          current_amount: input.currentAmount,
          currency: input.currency,
          deadline: input.deadline,
        })
        .select(SAVINGS_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setProjects((current) => [rowToProject(data as unknown as SavingsRow), ...current])
    },
    [coupleId, userId],
  )

  const updateProject = useCallback(async (id: string, input: SavingsInput) => {
    const { data, error: updateError } = await supabase
      .from('savings_projects')
      .update({
        title: input.title,
        target_amount: input.targetAmount,
        current_amount: input.currentAmount,
        currency: input.currency,
        deadline: input.deadline,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(SAVINGS_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    const updated = rowToProject(data as unknown as SavingsRow)
    setProjects((current) => current.map((project) => (project.id === id ? updated : project)))
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('savings_projects').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setProjects((current) => current.filter((project) => project.id !== id))
  }, [])

  return { projects, loading, error, refresh, createProject, updateProject, deleteProject }
}

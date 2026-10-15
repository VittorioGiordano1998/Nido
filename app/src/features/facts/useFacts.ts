import { useCallback, useEffect, useMemo, useState } from 'react'

import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

export interface PartnerFact {
  id: string
  coupleId: string
  subjectId: string
  category: string | null
  label: string
  value: string | null
  updatedBy: string
  updatedAt: string
}

export interface FactInput {
  subjectId: string
  category: string | null
  label: string
  value: string | null
}

interface FactRow {
  id: string
  couple_id: string
  subject_id: string
  category: string | null
  label: string
  value: string | null
  updated_by: string
  updated_at: string
}

const FACT_COLUMNS = 'id, couple_id, subject_id, category, label, value, updated_by, updated_at'

function rowToFact(row: FactRow): PartnerFact {
  return {
    id: row.id,
    coupleId: row.couple_id,
    subjectId: row.subject_id,
    category: row.category,
    label: row.label,
    value: row.value,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  }
}

function upsertFact(facts: PartnerFact[], next: PartnerFact): PartnerFact[] {
  return [...facts.filter((fact) => fact.id !== next.id), next].sort(
    (a, b) =>
      (a.category ?? '').localeCompare(b.category ?? '', 'it') ||
      a.label.localeCompare(b.label, 'it'),
  )
}

function hasId(value: unknown): value is { id: string } {
  return (
    typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string'
  )
}

/**
 * "Cosa c'è da sapere" (state layer): schede fattuali sui due partner,
 * con Realtime. Scritture consentite alla coppia (RLS su `updated_by`).
 */
export function useFacts() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [facts, setFacts] = useState<PartnerFact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setFacts([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('partner_facts')
      .select(FACT_COLUMNS)
      .eq('couple_id', coupleId)
      .order('category', { ascending: true })
      .order('label', { ascending: true })
    if (loadError) {
      setError(loadError.message)
    } else {
      setFacts(((data ?? []) as unknown as FactRow[]).map(rowToFact))
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
      .channel(uniqueChannelTopic(`facts-${coupleId}`))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partner_facts', filter: `couple_id=eq.${coupleId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            if (hasId(payload.old)) {
              const removed = payload.old.id
              setFacts((current) => current.filter((fact) => fact.id !== removed))
            }
            return
          }
          if (hasId(payload.new)) {
            const row = payload.new as unknown as FactRow
            setFacts((current) => upsertFact(current, rowToFact(row)))
          }
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId])

  const createFact = useCallback(
    async (input: FactInput) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('partner_facts')
        .insert({
          couple_id: coupleId,
          subject_id: input.subjectId,
          category: input.category,
          label: input.label,
          value: input.value,
          updated_by: userId,
        })
        .select(FACT_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setFacts((current) => upsertFact(current, rowToFact(data as unknown as FactRow)))
    },
    [coupleId, userId],
  )

  const updateFact = useCallback(
    async (id: string, input: Omit<FactInput, 'subjectId'>) => {
      if (!userId) throw new Error('Profilo non ancora caricato.')
      const { data, error: updateError } = await supabase
        .from('partner_facts')
        .update({
          category: input.category,
          label: input.label,
          value: input.value,
          updated_by: userId,
        })
        .eq('id', id)
        .select(FACT_COLUMNS)
        .single()
      if (updateError) throw new Error(updateError.message)
      setFacts((current) => upsertFact(current, rowToFact(data as unknown as FactRow)))
    },
    [userId],
  )

  const deleteFact = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('partner_facts').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setFacts((current) => current.filter((fact) => fact.id !== id))
  }, [])

  const value = useMemo(
    () => ({ facts, loading, error, refresh, createFact, updateFact, deleteFact }),
    [facts, loading, error, refresh, createFact, updateFact, deleteFact],
  )
  return value
}

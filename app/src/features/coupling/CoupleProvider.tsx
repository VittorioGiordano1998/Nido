import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'

export interface CoupleMember {
  userId: string
  displayName: string
  birthDate: string | null
  joinedAt: string
}

export interface CoupleInfo {
  id: string
  name: string | null
  inviteCode: string | null
  startedAt: string | null
  members: CoupleMember[]
}

type CoupleContextValue = {
  couple: CoupleInfo | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createCouple: (input: { name: string; startedAt: string | null }) => Promise<void>
  joinCouple: (code: string) => Promise<void>
}

const CoupleContext = createContext<CoupleContextValue | null>(null)

function translateJoinError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid_code')) return 'Codice non valido: controlla di averlo scritto bene.'
  if (m.includes('couple_full')) return 'Questa coppia ha già due membri.'
  if (m.includes('already_in_couple')) return 'Fai già parte di una coppia.'
  return message
}

async function fetchCouple(): Promise<CoupleInfo | null> {
  const { data: membership, error: membershipError } = await supabase
    .from('couple_members')
    .select('couple_id')
    .limit(1)
    .maybeSingle()
  if (membershipError) throw new Error(membershipError.message)
  if (!membership) return null

  const coupleId = (membership as { couple_id: string }).couple_id

  const { data: coupleRow, error: coupleError } = await supabase
    .from('couples')
    .select('id, name, invite_code, started_at')
    .eq('id', coupleId)
    .single()
  if (coupleError) throw new Error(coupleError.message)

  const { data: memberRows, error: membersError } = await supabase
    .from('couple_members')
    .select('user_id, joined_at')
    .eq('couple_id', coupleId)
  if (membersError) throw new Error(membersError.message)

  const rows = (memberRows ?? []) as Array<{ user_id: string; joined_at: string }>
  const profileById = new Map<string, { display_name: string | null; birth_date: string | null }>()

  if (rows.length > 0) {
    const { data: profileRows, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, birth_date')
      .in(
        'id',
        rows.map((row) => row.user_id),
      )
    if (profilesError) throw new Error(profilesError.message)
    for (const profile of (profileRows ?? []) as Array<{
      id: string
      display_name: string | null
      birth_date: string | null
    }>) {
      profileById.set(profile.id, profile)
    }
  }

  const couple = coupleRow as {
    id: string
    name: string | null
    invite_code: string | null
    started_at: string | null
  }

  return {
    id: couple.id,
    name: couple.name,
    inviteCode: couple.invite_code,
    startedAt: couple.started_at,
    members: rows.map((row) => {
      const profile = profileById.get(row.user_id)
      return {
        userId: row.user_id,
        displayName: profile?.display_name ?? 'Senza nome',
        birthDate: profile?.birth_date ?? null,
        joinedAt: row.joined_at,
      }
    }),
  }
}

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null

  const [couple, setCouple] = useState<CoupleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setCouple(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setCouple(await fetchCouple())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di caricamento.')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<CoupleContextValue>(
    () => ({
      couple,
      loading,
      error,
      refresh,
      createCouple: async ({ name, startedAt }) => {
        const { error: rpcError } = await supabase.rpc('create_couple', {
          p_name: name,
          p_started_at: startedAt,
        })
        if (rpcError) throw new Error(rpcError.message)
        await refresh()
      },
      joinCouple: async (code) => {
        const { error: rpcError } = await supabase.rpc('join_couple', { p_code: code })
        if (rpcError) throw new Error(translateJoinError(rpcError.message))
        await refresh()
      },
    }),
    [couple, loading, error, refresh],
  )

  return <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>
}

export function useCouple(): CoupleContextValue {
  const ctx = useContext(CoupleContext)
  if (!ctx) throw new Error('useCouple richiede CoupleProvider')
  return ctx
}

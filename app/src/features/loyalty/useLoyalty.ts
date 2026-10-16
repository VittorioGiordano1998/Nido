import { useCallback, useEffect, useState } from 'react'

import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Loyalty cards (state layer): couple-shared store cards shown at the counter.
 * The code is rendered locally (jsbarcode/react-qr-code); the card view never
 * calls the network.
 */

export type BarcodeType = 'code128' | 'ean13' | 'code39' | 'qr'

export interface LoyaltyCard {
  id: string
  coupleId: string
  storeName: string
  code: string
  barcodeType: BarcodeType
  color: string
  createdAt: string
}

export interface LoyaltyInput {
  storeName: string
  code: string
  barcodeType: BarcodeType
  color: string
}

interface LoyaltyRow {
  id: string
  couple_id: string
  store_name: string
  code: string
  barcode_type: string | null
  color: string | null
  created_at: string
}

const LOYALTY_COLUMNS = 'id, couple_id, store_name, code, barcode_type, color, created_at'
const BARCODE_TYPES: readonly BarcodeType[] = ['code128', 'ean13', 'code39', 'qr']

function asType(value: string | null): BarcodeType {
  return BARCODE_TYPES.includes(value as BarcodeType) ? (value as BarcodeType) : 'code128'
}

function rowToCard(row: LoyaltyRow): LoyaltyCard {
  return {
    id: row.id,
    coupleId: row.couple_id,
    storeName: row.store_name,
    code: row.code,
    barcodeType: asType(row.barcode_type),
    color: row.color ?? 'terra',
    createdAt: row.created_at,
  }
}

export function useLoyalty() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [cards, setCards] = useState<LoyaltyCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setCards([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('loyalty_cards')
      .select(LOYALTY_COLUMNS)
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false })
    if (loadError) {
      setError(loadError.message)
    } else {
      setCards(((data ?? []) as unknown as LoyaltyRow[]).map(rowToCard))
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
      .channel(uniqueChannelTopic(`loyalty-${coupleId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_cards',
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

  const createCard = useCallback(
    async (input: LoyaltyInput) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('loyalty_cards')
        .insert({
          couple_id: coupleId,
          created_by: userId,
          store_name: input.storeName,
          code: input.code,
          barcode_type: input.barcodeType,
          color: input.color,
        })
        .select(LOYALTY_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setCards((current) => [rowToCard(data as unknown as LoyaltyRow), ...current])
    },
    [coupleId, userId],
  )

  const updateCard = useCallback(async (id: string, input: LoyaltyInput) => {
    const { data, error: updateError } = await supabase
      .from('loyalty_cards')
      .update({
        store_name: input.storeName,
        code: input.code,
        barcode_type: input.barcodeType,
        color: input.color,
      })
      .eq('id', id)
      .select(LOYALTY_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    const updated = rowToCard(data as unknown as LoyaltyRow)
    setCards((current) => current.map((card) => (card.id === id ? updated : card)))
  }, [])

  const deleteCard = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('loyalty_cards').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setCards((current) => current.filter((card) => card.id !== id))
  }, [])

  /** Re-inserts a deleted card (undo toast, TASK-UI-…-001). */
  const restoreCard = useCallback(
    async (card: LoyaltyCard) => {
      const { data, error: insertError } = await supabase
        .from('loyalty_cards')
        .insert({
          id: card.id,
          couple_id: card.coupleId,
          created_by: userId,
          store_name: card.storeName,
          code: card.code,
          barcode_type: card.barcodeType,
          color: card.color,
        })
        .select(LOYALTY_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setCards((current) => [rowToCard(data as unknown as LoyaltyRow), ...current])
    },
    [userId],
  )

  return { cards, loading, error, refresh, createCard, updateCard, deleteCard, restoreCard }
}

import { useCallback, useEffect, useState } from 'react'

import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Wishlist (state layer): wishes per partner, a "preso" toggle that records
 * who bought the item, Realtime on `wishlist_items` (couple-wide RLS).
 */

export interface WishItem {
  id: string
  coupleId: string
  ownerId: string
  title: string
  url: string | null
  price: number | null
  currency: string
  notes: string | null
  priority: number
  purchased: boolean
  purchasedBy: string | null
  createdAt: string
}

export interface WishInput {
  title: string
  url: string | null
  price: number | null
  currency: string
  notes: string | null
  priority: number
}

interface WishRow {
  id: string
  couple_id: string
  owner_id: string
  title: string
  url: string | null
  price: number | string | null
  currency: string | null
  notes: string | null
  priority: number
  purchased: boolean
  purchased_by: string | null
  created_at: string
}

const WISH_COLUMNS =
  'id, couple_id, owner_id, title, url, price, currency, notes, priority, purchased, purchased_by, created_at'

function rowToItem(row: WishRow): WishItem {
  return {
    id: row.id,
    coupleId: row.couple_id,
    ownerId: row.owner_id,
    title: row.title,
    url: row.url,
    price: row.price === null ? null : Number(row.price),
    currency: row.currency ?? 'EUR',
    notes: row.notes,
    priority: row.priority,
    purchased: row.purchased,
    purchasedBy: row.purchased_by,
    createdAt: row.created_at,
  }
}

export function useWishlist() {
  const { couple } = useCouple()
  const { session } = useAuth()
  const coupleId = couple?.id ?? null
  const userId = session?.user.id ?? null

  const [items, setItems] = useState<WishItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('wishlist_items')
      .select(WISH_COLUMNS)
      .eq('couple_id', coupleId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
    if (loadError) {
      setError(loadError.message)
    } else {
      setItems(((data ?? []) as unknown as WishRow[]).map(rowToItem))
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
      .channel(uniqueChannelTopic(`wishlist-${coupleId}`))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlist_items',
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

  const createItem = useCallback(
    async (input: WishInput) => {
      if (!coupleId || !userId) throw new Error('Coppia non ancora caricata.')
      const { data, error: insertError } = await supabase
        .from('wishlist_items')
        .insert({
          couple_id: coupleId,
          owner_id: userId,
          title: input.title,
          url: input.url,
          price: input.price,
          currency: input.currency,
          notes: input.notes,
          priority: input.priority,
        })
        .select(WISH_COLUMNS)
        .single()
      if (insertError) throw new Error(insertError.message)
      setItems((current) => [rowToItem(data as unknown as WishRow), ...current])
    },
    [coupleId, userId],
  )

  const updateItem = useCallback(async (id: string, input: WishInput) => {
    const { data, error: updateError } = await supabase
      .from('wishlist_items')
      .update({
        title: input.title,
        url: input.url,
        price: input.price,
        currency: input.currency,
        notes: input.notes,
        priority: input.priority,
      })
      .eq('id', id)
      .select(WISH_COLUMNS)
      .single()
    if (updateError) throw new Error(updateError.message)
    const updated = rowToItem(data as unknown as WishRow)
    setItems((current) => current.map((item) => (item.id === id ? updated : item)))
  }, [])

  const togglePurchased = useCallback(
    async (item: WishItem) => {
      if (!userId) throw new Error('Sessione non ancora caricata.')
      const nextPurchased = !item.purchased
      const { data, error: updateError } = await supabase
        .from('wishlist_items')
        .update({
          purchased: nextPurchased,
          purchased_by: nextPurchased ? userId : null,
        })
        .eq('id', item.id)
        .select(WISH_COLUMNS)
        .single()
      if (updateError) throw new Error(updateError.message)
      const updated = rowToItem(data as unknown as WishRow)
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)))
    },
    [userId],
  )

  const deleteItem = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('wishlist_items').delete().eq('id', id)
    if (deleteError) throw new Error(deleteError.message)
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  return { items, loading, error, refresh, createItem, updateItem, togglePurchased, deleteItem }
}

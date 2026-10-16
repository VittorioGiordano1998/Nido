import { useCallback, useEffect, useState } from 'react'

import { LIST_PHOTO_BUCKET, signPhotoUrls, uploadPhoto } from '../../core/photos'
import { uniqueChannelTopic } from '../../core/realtime'
import { supabase } from '../../core/supabase'
import { DEFAULT_FRAMING, clampFraming, removePhotoIfUnused } from '../lists/photos'
import type { Framing } from '../lists/photos'
import { useCouple } from './CoupleProvider'

/**
 * Couple hero photo (state layer, TASK-HOME-…-002): the Home cover lives on
 * `couples` (path in the private `list-photos` bucket + framing) and syncs
 * over Realtime. Both partners may change it.
 */

interface HeroRow {
  hero_path: string | null
  hero_x: number | null
  hero_y: number | null
  hero_zoom: number | null
}

const HERO_COLUMNS = 'hero_path, hero_x, hero_y, hero_zoom'

export function useCoupleHero() {
  const { couple } = useCouple()
  const coupleId = couple?.id ?? null

  const [heroPath, setHeroPath] = useState<string | null>(null)
  const [framing, setFraming] = useState<Framing>(DEFAULT_FRAMING)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!coupleId) {
      setHeroPath(null)
      setFraming(DEFAULT_FRAMING)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('couples')
      .select(HERO_COLUMNS)
      .eq('id', coupleId)
      .single()
    if (loadError) {
      setError(loadError.message)
    } else {
      const row = data as unknown as HeroRow
      setHeroPath(row.hero_path)
      setFraming(
        clampFraming({
          x: row.hero_x ?? DEFAULT_FRAMING.x,
          y: row.hero_y ?? DEFAULT_FRAMING.y,
          zoom: row.hero_zoom ?? DEFAULT_FRAMING.zoom,
        }),
      )
      setError(null)
    }
    setLoading(false)
  }, [coupleId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Signed URL for the stored cover.
  useEffect(() => {
    if (!heroPath) {
      setUrl(null)
      return
    }
    let active = true
    void signPhotoUrls(LIST_PHOTO_BUCKET, [heroPath])
      .then((map) => {
        if (active) setUrl(map[heroPath] ?? null)
      })
      .catch(() => {
        if (active) setUrl(null)
      })
    return () => {
      active = false
    }
  }, [heroPath])

  // The partner's change to `couples` (cover set, moved or removed).
  useEffect(() => {
    if (!coupleId) return
    const channel = supabase
      .channel(uniqueChannelTopic(`couple-hero-${coupleId}`))
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        () => {
          void refresh()
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [coupleId, refresh])

  /** Uploads a picked file and returns the storage path (pending, not saved). */
  const uploadPending = useCallback(
    async (file: File): Promise<string> => {
      if (!coupleId) throw new Error('Coppia non ancora caricata.')
      return uploadPhoto(LIST_PHOTO_BUCKET, coupleId, file)
    },
    [coupleId],
  )

  /** Stores the pending path and its framing on the couple. */
  const saveHero = useCallback(
    async (path: string, nextFraming: Framing) => {
      if (!coupleId) throw new Error('Coppia non ancora caricata.')
      const clean = clampFraming(nextFraming)
      setBusy(true)
      setError(null)
      try {
        const previous = heroPath
        const { error: updateError } = await supabase
          .from('couples')
          .update({
            hero_path: path,
            hero_x: Math.round(clean.x),
            hero_y: Math.round(clean.y),
            hero_zoom: Number(clean.zoom.toFixed(2)),
          })
          .eq('id', coupleId)
        if (updateError) throw new Error(updateError.message)
        setHeroPath(path)
        setFraming(clean)
        if (previous && previous !== path) await removePhotoIfUnused(previous)
      } finally {
        setBusy(false)
      }
    },
    [coupleId, heroPath],
  )

  /** Best-effort cleanup of an upload the user cancelled (framing editor closed). */
  const discardPending = useCallback(async (path: string) => {
    await removePhotoIfUnused(path)
  }, [])

  const clearHero = useCallback(async () => {
    if (!coupleId) throw new Error('Coppia non ancora caricata.')
    setBusy(true)
    setError(null)
    try {
      const previous = heroPath
      const { error: updateError } = await supabase
        .from('couples')
        .update({ hero_path: null, hero_x: null, hero_y: null, hero_zoom: null })
        .eq('id', coupleId)
      if (updateError) throw new Error(updateError.message)
      setHeroPath(null)
      setFraming(DEFAULT_FRAMING)
      if (previous) await removePhotoIfUnused(previous)
    } finally {
      setBusy(false)
    }
  }, [coupleId, heroPath])

  return {
    heroPath,
    framing,
    url,
    loading,
    busy,
    error,
    uploadPending,
    saveHero,
    discardPending,
    clearHero,
    refresh,
  }
}

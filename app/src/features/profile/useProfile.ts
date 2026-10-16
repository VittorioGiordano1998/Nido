import { useEffect, useState } from 'react'

import { AVATAR_BUCKET, signPhotoUrls, uploadPhoto } from '../../core/photos'
import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useCouple } from '../coupling/CoupleProvider'

/**
 * Loads and saves the signed-in user's profile row (display name, birthday,
 * sex, avatar photo). State layer: the profile view must not touch Supabase
 * directly (RULES.local, Layers). `sex` gates the cycle section
 * (TASK-CYC-...-002); the avatar is either an external OAuth URL or a path in
 * the private `avatars` bucket (TASK-PROF-...-002).
 */

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

/** Display-ready URL for a stored avatar value (external as-is, paths signed). */
async function resolveAvatarDisplay(raw: string | null): Promise<string | null> {
  if (!raw) return null
  if (isExternalUrl(raw)) return raw
  try {
    const urls = await signPhotoUrls(AVATAR_BUCKET, [raw])
    return urls[raw] ?? null
  } catch {
    return null
  }
}

/** Removes an uploaded avatar object once no profile references it (best effort). */
async function removeAvatarObjectIfUnused(path: string): Promise<void> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('avatar_url', path)
    .limit(1)
    .maybeSingle()
  if (data) return
  await supabase.storage.from(AVATAR_BUCKET).remove([path])
}

export function useProfile() {
  const { session } = useAuth()
  const { couple } = useCouple()
  const userId = session?.user.id

  const [displayName, setDisplayName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState('')
  const [avatarRaw, setAvatarRaw] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    void (async () => {
      const { data, error: loadError } = await supabase
        .from('profiles')
        .select('display_name, birth_date, sex, avatar_url')
        .eq('id', userId)
        .single()
      if (!active) return
      if (loadError) {
        setError(loadError.message)
      } else if (data) {
        setDisplayName((data.display_name as string | null) ?? '')
        setBirthDate((data.birth_date as string | null) ?? '')
        setSex((data.sex as string | null) ?? '')
        const raw = (data.avatar_url as string | null) ?? null
        setAvatarRaw(raw)
        setAvatarUrl(await resolveAvatarDisplay(raw))
      }
      if (active) setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [userId])

  async function save(): Promise<boolean> {
    if (!userId) return false
    setSaving(true)
    setError(null)
    const { error: saveError } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || 'Senza nome',
        birth_date: birthDate || null,
        sex: sex || null,
      })
      .eq('id', userId)
    setSaving(false)
    if (saveError) {
      setError(saveError.message)
      return false
    }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
    return true
  }

  /** Uploads and stores a new avatar (downscaled); the old object goes away. */
  async function uploadAvatar(file: File): Promise<boolean> {
    if (!userId || !couple?.id) {
      setError('Coppia non ancora caricata.')
      return false
    }
    setAvatarBusy(true)
    setError(null)
    try {
      const path = await uploadPhoto(AVATAR_BUCKET, couple.id, file, { maxSide: 512 })
      const previous = avatarRaw
      const { error: saveError } = await supabase
        .from('profiles')
        .update({ avatar_url: path })
        .eq('id', userId)
      if (saveError) throw new Error(saveError.message)
      setAvatarRaw(path)
      setAvatarUrl(await resolveAvatarDisplay(path))
      if (previous && previous !== path && !isExternalUrl(previous)) {
        await removeAvatarObjectIfUnused(previous)
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di caricamento della foto.')
      return false
    } finally {
      setAvatarBusy(false)
    }
  }

  async function removeAvatar(): Promise<void> {
    if (!userId) return
    setAvatarBusy(true)
    setError(null)
    try {
      const previous = avatarRaw
      const { error: saveError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)
      if (saveError) throw new Error(saveError.message)
      setAvatarRaw(null)
      setAvatarUrl(null)
      if (previous && !isExternalUrl(previous)) await removeAvatarObjectIfUnused(previous)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di salvataggio.')
    } finally {
      setAvatarBusy(false)
    }
  }

  return {
    displayName,
    setDisplayName,
    birthDate,
    setBirthDate,
    sex,
    setSex,
    avatarRaw,
    avatarUrl,
    avatarBusy,
    loading,
    saving,
    saved,
    error,
    save,
    uploadAvatar,
    removeAvatar,
  }
}

export type ProfileState = ReturnType<typeof useProfile>

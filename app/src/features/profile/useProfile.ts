import { useEffect, useState } from 'react'

import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'

/**
 * Loads and saves the signed-in user's profile row (display name, birthday, sex).
 * State layer: the profile view must not touch Supabase directly
 * (RULES.local, Layers). `sex` gates the cycle section (TASK-CYC-...-002).
 */
export function useProfile() {
  const { session } = useAuth()
  const userId = session?.user.id

  const [displayName, setDisplayName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState('')
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
        .select('display_name, birth_date, sex')
        .eq('id', userId)
        .single()
      if (!active) return
      if (loadError) {
        setError(loadError.message)
      } else if (data) {
        setDisplayName((data.display_name as string | null) ?? '')
        setBirthDate((data.birth_date as string | null) ?? '')
        setSex((data.sex as string | null) ?? '')
      }
      setLoading(false)
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

  return {
    displayName,
    setDisplayName,
    birthDate,
    setBirthDate,
    sex,
    setSex,
    loading,
    saving,
    saved,
    error,
    save,
  }
}

export type ProfileState = ReturnType<typeof useProfile>

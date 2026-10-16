import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'

/**
 * Per-type notification preferences (TASK-NOTIF-…-002), stored on the account
 * (`profiles.notification_prefs`) so every device and the server-side
 * deliveries read the same choice. Absent or malformed values behave as on.
 */

export type NotificationPrefKey = 'events' | 'reminders' | 'stickies' | 'moods' | 'nudges'
export type NotificationPrefs = Record<NotificationPrefKey, boolean>

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  events: true,
  reminders: true,
  stickies: true,
  moods: true,
  nudges: true,
}

export const NOTIFICATION_PREF_DEFS: ReadonlyArray<{
  key: NotificationPrefKey
  label: string
  description: string
}> = [
  {
    key: 'events',
    label: 'Novità del calendario',
    description: 'Quando il partner aggiunge un evento di coppia.',
  },
  {
    key: 'reminders',
    label: 'Promemoria degli eventi',
    description: 'Il promemoria prima di un evento, anche per email.',
  },
  {
    key: 'stickies',
    label: 'Bigliettini',
    description: 'Quando il partner ti lascia un bigliettino.',
  },
  {
    key: 'moods',
    label: 'Check-in del partner',
    description: 'Come sta oggi, quando fa il check-in.',
  },
  {
    key: 'nudges',
    label: 'Campanelli dalle liste',
    description: 'Un promemoria puntuale su una voce di lista.',
  },
]

function parsePrefs(raw: unknown): NotificationPrefs {
  const parsed = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
  const result: NotificationPrefs = { ...DEFAULT_NOTIFICATION_PREFS }
  for (const key of Object.keys(result) as NotificationPrefKey[]) {
    if (typeof parsed[key] === 'boolean') result[key] = parsed[key] as boolean
  }
  return result
}

export function useNotificationPrefs() {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    void (async () => {
      const { data, error: loadError } = await supabase
        .from('profiles')
        .select('notification_prefs')
        .eq('id', userId)
        .single()
      if (!active) return
      if (loadError) setError(loadError.message)
      else setPrefs(parsePrefs(data?.notification_prefs))
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [userId])

  /** Optimistic toggle with rollback; the server delivers on this value. */
  const toggle = useCallback(
    async (key: NotificationPrefKey) => {
      if (!userId) return
      const previous = prefs
      const next = { ...prefs, [key]: !prefs[key] }
      setPrefs(next)
      setError(null)
      const { error: saveError } = await supabase
        .from('profiles')
        .update({ notification_prefs: next })
        .eq('id', userId)
      if (saveError) {
        setPrefs(previous)
        setError(saveError.message)
      }
    },
    [prefs, userId],
  )

  return { prefs, loading, error, toggle }
}

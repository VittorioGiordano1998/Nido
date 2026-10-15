import { useCallback, useEffect, useState } from 'react'

import { supabase } from '../../core/supabase'
import { useAuth } from '../auth/AuthProvider'

type OnboardingStatus = 'loading' | 'todo' | 'done'

/** Device cache: keeps the intro from nagging when the row write is missing. */
const LOCAL_KEY_PREFIX = 'nido.onboarded.'

/**
 * First-run intro state (profiles.onboarded_at). The flag is per account; a
 * localStorage fallback keeps the behaviour sane on projects where the
 * matching apply script has not been pasted yet.
 */
export function useOnboarding() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [status, setStatus] = useState<OnboardingStatus>('loading')

  useEffect(() => {
    if (!userId) return
    let active = true
    void (async () => {
      try {
        if (window.localStorage.getItem(LOCAL_KEY_PREFIX + userId) === '1') {
          if (active) setStatus('done')
          return
        }
      } catch {
        // Private mode: fall through to the account row.
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarded_at')
        .eq('id', userId)
        .single()
      if (!active) return
      // A failed read (column not applied yet, offline) shows the slides;
      // complete() then writes the local flag so it does not reappear here.
      if (error) {
        setStatus('todo')
        return
      }
      setStatus(data?.onboarded_at ? 'done' : 'todo')
    })()
    return () => {
      active = false
    }
  }, [userId])

  const complete = useCallback(async () => {
    setStatus('done')
    if (!userId) return
    try {
      window.localStorage.setItem(LOCAL_KEY_PREFIX + userId, '1')
    } catch {
      // Best effort.
    }
    await supabase
      .from('profiles')
      .update({ onboarded_at: new Date().toISOString() })
      .eq('id', userId)
  }, [userId])

  return { status, complete }
}

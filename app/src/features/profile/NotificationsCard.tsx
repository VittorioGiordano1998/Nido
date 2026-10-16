import { useEffect, useState } from 'react'

import { Card, ErrorBanner } from '../../ui/components'
import { useAuth } from '../auth/AuthProvider'
import { disablePush, enablePush, isPushConfigured, isPushSubscribed } from '../settings/push'
import { NOTIFICATION_PREF_DEFS, useNotificationPrefs } from '../settings/notificationPrefs'
import { useSettings } from '../settings/SettingsProvider'

type PermissionState = NotificationPermission | 'unsupported'

function currentPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

function Switch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  label: string
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${
        checked ? 'bg-accent-600' : 'bg-line-strong'
      }`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

/**
 * Notifications: the per-device calendar reminders (scheduled while the app is
 * open) and the account-level push subscription (Web Push, delivered with the
 * app closed — ADR-PUSH-VITTORIOGIORDANOYBQ-001).
 */
export function NotificationsCard() {
  const { session } = useAuth()
  const userId = session?.user.id
  const { remindersEnabled, setRemindersEnabled } = useSettings()
  const notificationPrefs = useNotificationPrefs()
  const [permission, setPermission] = useState<PermissionState>(currentPermission)
  const [pushState, setPushState] = useState<'loading' | 'off' | 'on'>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void isPushSubscribed().then((subscribed) => {
      if (active) setPushState(subscribed ? 'on' : 'off')
    })
    return () => {
      active = false
    }
  }, [])

  async function toggleReminders() {
    if (permission === 'unsupported' || permission === 'denied') return
    if (!remindersEnabled && permission === 'default') {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') return
    }
    setRemindersEnabled(!remindersEnabled)
  }

  async function togglePush() {
    if (!userId || busy) return
    setBusy(true)
    setError(null)
    try {
      if (pushState === 'on') {
        await disablePush()
        setPushState('off')
      } else {
        await enablePush(userId)
        setPushState('on')
        setPermission(currentPermission())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore con le notifiche push.')
    } finally {
      setBusy(false)
    }
  }

  const remindersHint =
    permission === 'unsupported'
      ? 'Questo browser non supporta le notifiche.'
      : permission === 'denied'
        ? 'Notifiche bloccate dal browser: riabilitale dalle impostazioni del sito.'
        : "Un promemoria 15 minuti prima dell'evento (alle 9 per i tutto il giorno), mentre l'app è aperta."

  const pushHint = !isPushConfigured
    ? 'Push non configurate in questo ambiente (serve VITE_VAPID_PUBLIC_KEY).'
    : permission === 'denied'
      ? 'Notifiche bloccate dal browser: riabilitale dalle impostazioni del sito.'
      : 'Avvisi anche ad app chiusa: promemoria del partner e novità importanti.'

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Notifiche
      </h2>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Promemoria eventi</p>
            <p className="text-xs text-ink-muted">{remindersHint}</p>
          </div>
          <Switch
            checked={remindersEnabled}
            disabled={permission === 'unsupported' || permission === 'denied'}
            label="Attiva o disattiva i promemoria eventi"
            onChange={() => void toggleReminders()}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Notifiche push</p>
            <p className="text-xs text-ink-muted">{pushHint}</p>
          </div>
          <Switch
            checked={pushState === 'on'}
            disabled={
              !isPushConfigured || permission === 'denied' || pushState === 'loading' || busy
            }
            label="Attiva o disattiva le notifiche push"
            onChange={() => void togglePush()}
          />
        </div>

        <div className="space-y-3 border-t border-line pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Cosa mi avvisa
          </p>
          {notificationPrefs.error && <ErrorBanner message={notificationPrefs.error} />}
          {NOTIFICATION_PREF_DEFS.map((def) => (
            <div key={def.key} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{def.label}</p>
                <p className="text-xs text-ink-muted">{def.description}</p>
              </div>
              <Switch
                checked={notificationPrefs.prefs[def.key]}
                disabled={notificationPrefs.loading}
                label={`Attiva o disattiva: ${def.label}`}
                onChange={() => void notificationPrefs.toggle(def.key)}
              />
            </div>
          ))}
          <p className="text-xs text-ink-faint">
            La scelta vale su tutti i dispositivi e anche ad app chiusa.
          </p>
        </div>
      </div>
    </Card>
  )
}

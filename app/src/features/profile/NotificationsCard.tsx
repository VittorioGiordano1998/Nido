import { useState } from 'react'

import { Card } from '../../ui/components'
import { useSettings } from '../settings/SettingsProvider'

type PermissionState = NotificationPermission | 'unsupported'

function currentPermission(): PermissionState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
}

/**
 * Per-device reminder switch for calendar events. Enabling it asks for the
 * browser notification permission; the scheduling itself lives in
 * `features/calendar/reminders.ts` and runs while the app is open.
 */
export function NotificationsCard() {
  const { remindersEnabled, setRemindersEnabled } = useSettings()
  const [permission, setPermission] = useState<PermissionState>(currentPermission)

  async function toggle() {
    if (permission === 'unsupported' || permission === 'denied') return
    if (!remindersEnabled && permission === 'default') {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') return
    }
    setRemindersEnabled(!remindersEnabled)
  }

  const hint =
    permission === 'unsupported'
      ? 'Questo browser non supporta le notifiche.'
      : permission === 'denied'
        ? 'Notifiche bloccate dal browser: riabilitale dalle impostazioni del sito.'
        : "Un promemoria 15 minuti prima dell'evento (alle 9 per i tutto il giorno), mentre l'app è aperta."

  return (
    <Card>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">
        Notifiche
      </h2>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Promemoria eventi</p>
          <p className="text-xs text-ink-muted">{hint}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={remindersEnabled}
          aria-label="Attiva o disattiva i promemoria eventi"
          disabled={permission === 'unsupported' || permission === 'denied'}
          onClick={() => void toggle()}
          className={`h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${
            remindersEnabled ? 'bg-accent-600' : 'bg-line-strong'
          }`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white shadow transition ${
              remindersEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </Card>
  )
}

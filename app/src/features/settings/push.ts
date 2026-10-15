import { env } from '../../core/env'
import { supabase } from '../../core/supabase'

/**
 * Web Push subscription (ADR-PUSH-VITTORIOGIORDANOYBQ-001): the browser
 * subscribes through the service worker (`app/public/sw.js`), the endpoint and
 * keys land in `push_tokens` (`platform = 'web'`), and the `send-push` Edge
 * Function fan-out is triggered by the database webhook.
 */

export const isPushConfigured = env.vapidPublicKey.length > 0

function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

/** VAPID public keys travel base64url; PushManager wants bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(normalized)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index)
  }
  return bytes
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  return Boolean(subscription)
}

export async function enablePush(userId: string): Promise<void> {
  if (!isPushConfigured) {
    throw new Error('Notifiche push non configurate: manca VITE_VAPID_PUBLIC_KEY.')
  }
  if (!isPushSupported()) {
    throw new Error('Questo browser non supporta le notifiche push.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Permesso notifiche non concesso: controlla le impostazioni del browser.')
  }

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(env.vapidPublicKey),
  })

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      token: subscription.endpoint,
      platform: 'web',
      keys: json.keys ?? null,
    },
    { onConflict: 'user_id,token' },
  )
  if (error) {
    // Do not leave a subscription the server will never see.
    await subscription.unsubscribe().catch(() => undefined)
    throw new Error(error.message)
  }
}

export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  await supabase.from('push_tokens').delete().eq('token', subscription.endpoint)
  await subscription.unsubscribe()
}

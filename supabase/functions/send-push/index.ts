// Supabase Edge Function: send-push.
//
// Delivers a Web Push notification for partner activity. A database webhook
// (Dashboard -> Integrations -> Webhooks, or the SQL in
// supabase/apply-push-events.sql, supabase/apply-push-moments.sql) posts the
// row payload; the source is the payload's `table`:
//
//   nudges   -> a partner nudge      ("Ti ricordo io 💛")
//   events   -> a couple event added ("{Nome} ha aggiunto «Titolo»")
//   stickies -> a sticky note left   ("{Nome} ti ha lasciato un bigliettino")
//   moods    -> a mood check-in      ("{Nome} ha fatto il check-in")
//
// Recipients can mute a type from Profile -> Notifiche
// (`profiles.notification_prefs`, TASK-NOTIF-VITTORIOGIORDANOYBQ-002): a muted
// type is skipped here, so the choice applies to every device.
//
// The webhooks authenticate with the shared secret header `x-webhook-secret`
// (SEND_PUSH_SECRET), so the function runs with verify_jwt = false (see
// supabase/config.toml). Auth, fan-out and the 404/410 pruning stay in one
// place for every source.
//
// Secrets required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
// SEND_PUSH_SECRET. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected.
//
// Expired subscriptions answer 404/410: the row is removed here.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

interface WebhookPayload {
  table?: string
  record?: Record<string, unknown> | null
}

interface NudgeRecord {
  id?: string
  from_user?: string
  to_user?: string
  message?: string | null
  task_id?: string | null
}

interface EventRecord {
  id?: string
  couple_id?: string
  title?: string
  start_at?: string
  all_day?: boolean
  location?: string | null
  visibility?: string
  created_by?: string
}

interface StickyRecord {
  id?: string
  from_user?: string
  to_user?: string
  body?: string
}

interface MoodRecord {
  id?: string
  couple_id?: string
  user_id?: string
  mood?: number
  mood_date?: string
  note?: string | null
}

/** Mood faces mirroring `MOOD_LEVELS` in the app (TASK-MOOD-…-001). */
const MOOD_LEVELS: Record<number, { label: string; emoji: string }> = {
  1: { label: 'Male', emoji: '😞' },
  2: { label: 'Giù', emoji: '😕' },
  3: { label: 'Così così', emoji: '🙂' },
  4: { label: 'Bene', emoji: '😄' },
  5: { label: 'Al top', emoji: '🤩' },
}

interface Notification {
  title: string
  body: string
  tag: string
  url: string
}

type Supabase = ReturnType<typeof createClient>

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function displayName(
  profiles: Array<{ id: string; display_name: string }> | null,
  userId: string,
): string {
  return profiles?.find((profile) => profile.id === userId)?.display_name || 'Il partner'
}

/** "gio 15 ott · ore 15:30", or "Tutto il giorno · gio 15 ott": the couple's
 * own time zone (the app is Italian), as the calendar shows the event. */
function eventWhen(startAt: string, allDay: boolean, location: string | null): string {
  const start = new Date(startAt)
  const day = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(start)

  const parts = [allDay ? `Tutto il giorno · ${day}` : `${day} · ore ${timeOf(start)}`]
  if (location) parts.push(location)
  return parts.join(' · ')
}

function timeOf(start: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
  }).format(start)
}

/** Recipient preference (TASK-NOTIF-…-002): a missing row or key means on. */
async function isMuted(supabase: Supabase, userId: string, prefKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('notification_prefs')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return false
  const prefs = (data.notification_prefs ?? {}) as Record<string, unknown>
  return prefs[prefKey] === false
}

async function sendToUser(
  supabase: Supabase,
  userId: string,
  notification: Notification,
): Promise<number> {
  const { data: tokens, error } = await supabase
    .from('push_tokens')
    .select('id, token, keys')
    .eq('user_id', userId)
  if (error) throw new Error(error.message)

  let sent = 0
  for (const row of tokens ?? []) {
    if (!row.keys) continue
    try {
      await webpush.sendNotification(
        { endpoint: row.token, keys: row.keys as { p256dh: string; auth: string } },
        JSON.stringify(notification),
      )
      sent += 1
    } catch (sendError) {
      const status = (sendError as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await supabase.from('push_tokens').delete().eq('id', row.id)
      }
    }
  }
  return sent
}

async function pushNudge(supabase: Supabase, record: Record<string, unknown>): Promise<Response> {
  const nudge = record as NudgeRecord
  if (!nudge.id || !nudge.from_user || !nudge.to_user) {
    return json({ error: 'bad payload' }, 400)
  }
  if (await isMuted(supabase, nudge.to_user, 'nudges')) {
    return json({ sent: 0, skipped: 'muted' })
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', [nudge.from_user, nudge.to_user])

  const notification: Notification = {
    title: displayName(profiles, nudge.from_user),
    body: nudge.message || 'Ti ricordo io 💛',
    tag: `nudge-${nudge.id}`,
    url: nudge.task_id ? '/lists' : '/us',
  }

  return json({ sent: await sendToUser(supabase, nudge.to_user, notification) })
}

async function pushEvent(supabase: Supabase, record: Record<string, unknown>): Promise<Response> {
  const event = record as EventRecord
  if (!event.id || !event.couple_id || !event.created_by || !event.title || !event.start_at) {
    return json({ error: 'bad payload' }, 400)
  }

  // Private events never notify the partner. The webhook trigger already
  // filters them; the rule stays enforced here so another source wired to the
  // same function cannot leak one.
  if (event.visibility !== 'couple') {
    return json({ sent: 0, skipped: event.visibility ?? 'unknown visibility' })
  }

  const { data: members, error } = await supabase
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', event.couple_id)
  if (error) return json({ error: error.message }, 500)

  const partner = (members ?? [])
    .map((member) => member.user_id as string)
    .find((userId) => userId !== event.created_by)
  // No partner in the couple yet: nothing to deliver to.
  if (!partner) return json({ sent: 0, skipped: 'no partner' })
  if (await isMuted(supabase, partner, 'events')) {
    return json({ sent: 0, skipped: 'muted' })
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', [event.created_by, partner])

  const notification: Notification = {
    title: `${displayName(profiles, event.created_by)} ha aggiunto «${event.title}»`,
    body: eventWhen(event.start_at, event.all_day === true, event.location ?? null),
    tag: `event-${event.id}`,
    url: '/calendar',
  }

  return json({ sent: await sendToUser(supabase, partner, notification) })
}

async function pushSticky(supabase: Supabase, record: Record<string, unknown>): Promise<Response> {
  const sticky = record as StickyRecord
  if (!sticky.id || !sticky.from_user || !sticky.to_user || typeof sticky.body !== 'string') {
    return json({ error: 'bad payload' }, 400)
  }
  if (await isMuted(supabase, sticky.to_user, 'stickies')) {
    return json({ sent: 0, skipped: 'muted' })
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', [sticky.from_user, sticky.to_user])

  const text = sticky.body.length > 140 ? `${sticky.body.slice(0, 137)}…` : sticky.body
  const notification: Notification = {
    title: `${displayName(profiles, sticky.from_user)} ti ha lasciato un bigliettino`,
    body: text,
    tag: `sticky-${sticky.id}`,
    url: '/',
  }

  return json({ sent: await sendToUser(supabase, sticky.to_user, notification) })
}

async function pushMood(supabase: Supabase, record: Record<string, unknown>): Promise<Response> {
  const mood = record as MoodRecord
  if (!mood.id || !mood.couple_id || !mood.user_id || typeof mood.mood !== 'number') {
    return json({ error: 'bad payload' }, 400)
  }

  const { data: members, error } = await supabase
    .from('couple_members')
    .select('user_id')
    .eq('couple_id', mood.couple_id)
  if (error) return json({ error: error.message }, 500)

  const partner = (members ?? [])
    .map((member) => member.user_id as string)
    .find((userId) => userId !== mood.user_id)
  if (!partner) return json({ sent: 0, skipped: 'no partner' })
  if (await isMuted(supabase, partner, 'moods')) {
    return json({ sent: 0, skipped: 'muted' })
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', [mood.user_id, partner])

  const level = MOOD_LEVELS[mood.mood] ?? { label: 'Check-in', emoji: '🙂' }
  const bodyParts = [`${level.label} ${level.emoji}`.trim()]
  if (typeof mood.note === 'string' && mood.note.trim()) bodyParts.push(`«${mood.note.trim()}»`)

  const notification: Notification = {
    title: `${displayName(profiles, mood.user_id)} ha fatto il check-in`,
    body: bodyParts.join(' · '),
    tag: `mood-${mood.user_id}-${mood.mood_date ?? mood.id}`,
    url: '/',
  }

  return json({ sent: await sendToUser(supabase, partner, notification) })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const secret = Deno.env.get('SEND_PUSH_SECRET')
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return json({ error: 'unauthorized' }, 401)
  }

  const payload = (await req.json().catch(() => null)) as WebhookPayload | null
  const record = payload?.record ?? null
  if (!record) return json({ error: 'bad payload' }, 400)

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:nido@example.com'
  if (!vapidPublicKey || !vapidPrivateKey) {
    return json({ error: 'missing VAPID secrets' }, 500)
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    if (payload?.table === 'events') return await pushEvent(supabase, record)
    if (payload?.table === 'nudges') return await pushNudge(supabase, record)
    if (payload?.table === 'stickies') return await pushSticky(supabase, record)
    if (payload?.table === 'moods') return await pushMood(supabase, record)
    return json({ error: 'unknown source' }, 400)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'send failed' }, 500)
  }
})

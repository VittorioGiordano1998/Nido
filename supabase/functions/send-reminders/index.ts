// Supabase Edge Function: send-reminders.
//
// Called every 5 minutes by the pg_cron job `nido-push-reminders` through
// pg_net (see supabase/migrations/20261015230000_nido_push_reminders.sql):
// sends the calendar reminders the app materialized (the client expands
// recurrences and writes the next days of fire instants into
// `push_reminders`) and marks them sent. A due reminder with no subscription
// is still marked sent: a reminder is only useful at its instant. Expired
// subscriptions answer 404/410 and are pruned here, like send-push; rows
// older than 30 days are pruned too.
//
// The function authenticates with the shared secret header `x-webhook-secret`
// (SEND_REMINDERS_SECRET), so it runs with verify_jwt = false (see
// supabase/config.toml). The cron job runs in UTC and only compares
// timestamptz: the fire instants were computed client-side in local time.
//
// Secrets required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
// SEND_REMINDERS_SECRET. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
// injected.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

/** Due rows per run: more than enough for one couple's horizon. */
const BATCH_LIMIT = 200
/** How long sent (and stale unsent) rows are kept for debugging. */
const PRUNE_DAYS = 30

interface ReminderRow {
  id: string
  couple_id: string
  occurrence_key: string
  title: string
  body: string
  only_for: string | null
}

interface TokenRow {
  id: string
  user_id: string
  token: string
  keys: { p256dh: string; auth: string } | null
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const secret = Deno.env.get('SEND_REMINDERS_SECRET')
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return json({ error: 'unauthorized' }, 401)
  }

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

  const { data: due, error: dueError } = await supabase
    .from('push_reminders')
    .select('id, couple_id, occurrence_key, title, body, only_for')
    .is('sent_at', null)
    .lte('fire_at', new Date().toISOString())
    .order('fire_at', { ascending: true })
    .limit(BATCH_LIMIT)
  if (dueError) return json({ error: dueError.message }, 500)

  const rows = (due ?? []) as ReminderRow[]
  const sentIds: string[] = []
  let sent = 0

  if (rows.length > 0) {
    // Recipients: `only_for` (a private event reminds its creator alone) or
    // both partners for a shared reminder.
    const coupleIds = [...new Set(rows.filter((row) => !row.only_for).map((row) => row.couple_id))]
    const membersByCouple = new Map<string, string[]>()
    if (coupleIds.length > 0) {
      const { data: members, error: memberError } = await supabase
        .from('couple_members')
        .select('couple_id, user_id')
        .in('couple_id', coupleIds)
      if (memberError) return json({ error: memberError.message }, 500)
      for (const member of members ?? []) {
        const list = membersByCouple.get(member.couple_id)
        if (list) list.push(member.user_id)
        else membersByCouple.set(member.couple_id, [member.user_id])
      }
    }

    const userIds = [
      ...new Set(
        rows.flatMap((row) =>
          row.only_for ? [row.only_for] : (membersByCouple.get(row.couple_id) ?? []),
        ),
      ),
    ]
    const tokens = new Map<string, TokenRow[]>()
    if (userIds.length > 0) {
      const { data, error: tokenError } = await supabase
        .from('push_tokens')
        .select('id, user_id, token, keys')
        .in('user_id', userIds)
      if (tokenError) return json({ error: tokenError.message }, 500)
      for (const token of (data ?? []) as TokenRow[]) {
        const list = tokens.get(token.user_id)
        if (list) list.push(token)
        else tokens.set(token.user_id, [token])
      }
    }

    for (const row of rows) {
      const recipients = row.only_for
        ? [row.only_for]
        : (membersByCouple.get(row.couple_id) ?? [])
      const notification = JSON.stringify({
        title: row.title,
        body: row.body,
        // Same tag as the local notification: the open app and the push
        // replace each other instead of showing twice.
        tag: row.occurrence_key,
        url: '/calendar',
      })
      for (const userId of recipients) {
        for (const token of tokens.get(userId) ?? []) {
          if (!token.keys) continue
          try {
            await webpush.sendNotification(
              { endpoint: token.token, keys: token.keys },
              notification,
            )
            sent += 1
          } catch (sendError) {
            const status = (sendError as { statusCode?: number }).statusCode
            if (status === 404 || status === 410) {
              await supabase.from('push_tokens').delete().eq('id', token.id)
            }
          }
        }
      }
      // No subscription means nothing to deliver: the reminder is spent either
      // way, so a missing device never makes it fire late on a later run.
      sentIds.push(row.id)
    }

    const { error: markError } = await supabase
      .from('push_reminders')
      .update({ sent_at: new Date().toISOString() })
      .in('id', sentIds)
    if (markError) return json({ error: markError.message, sent }, 500)
  }

  const cutoff = new Date(Date.now() - PRUNE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('push_reminders').delete().lt('sent_at', cutoff)
  await supabase.from('push_reminders').delete().is('sent_at', null).lt('fire_at', cutoff)

  return json({ sent, reminders: sentIds.length })
})

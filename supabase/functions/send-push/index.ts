// Supabase Edge Function: send-push.
//
// Delivers a Web Push notification to the partner when a `nudges` row is
// inserted; a database webhook (Dashboard -> Database -> Webhooks) calls this
// function with the row payload. The webhook authenticates with the shared
// secret header `x-webhook-secret` (SEND_PUSH_SECRET), so it runs with
// verify_jwt = false (see supabase/config.toml).
//
// Secrets required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
// SEND_PUSH_SECRET. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected.
//
// Expired subscriptions answer 404/410: the row is removed here.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

interface WebhookPayload {
  record?: {
    id?: string
    from_user?: string
    to_user?: string
    message?: string | null
    task_id?: string | null
  } | null
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const secret = Deno.env.get('SEND_PUSH_SECRET')
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return json({ error: 'unauthorized' }, 401)
  }

  const payload = (await req.json().catch(() => null)) as WebhookPayload | null
  const record = payload?.record ?? null
  if (!record?.id || !record.from_user || !record.to_user) {
    return json({ error: 'bad payload' }, 400)
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

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', [record.from_user, record.to_user])
  const fromName =
    profiles?.find((profile) => profile.id === record.from_user)?.display_name || 'Il partner'

  const { data: tokens, error } = await supabase
    .from('push_tokens')
    .select('id, token, keys')
    .eq('user_id', record.to_user)
  if (error) return json({ error: error.message }, 500)

  const notification = {
    title: fromName,
    body: record.message || 'Ti ricordo io 💛',
    tag: `nudge-${record.id}`,
    url: record.task_id ? '/lists' : '/us',
  }

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

  return json({ sent })
})

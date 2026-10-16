// Supabase Edge Function: send-reminders.
//
// Called every 5 minutes by the pg_cron job `nido-push-reminders` through
// pg_net (see supabase/migrations/20261015230000_nido_push_reminders.sql):
// delivers the calendar reminders the app materialized (the client expands
// recurrences and writes the next days of fire instants into
// `push_reminders`) and marks them sent. Two channels on purpose: Web Push
// (best effort, still bounded by browser state) and email (reliable with the
// app closed — TASK-NOTIF-VITTORIOGIORDANOYBQ-001).
//
// A due reminder with no reachable destination is still marked sent: a
// reminder is only useful at its instant, so nothing fires late on a later
// run. Expired subscriptions answer 404/410 and are pruned here, like
// send-push; rows older than 30 days are pruned too. Email failures are
// logged per recipient.
//
// The function authenticates with the shared secret header `x-webhook-secret`
// (SEND_REMINDERS_SECRET), so it runs with verify_jwt = false (see
// supabase/config.toml). The cron job runs in UTC and only compares
// timestamptz: the fire instants were computed client-side in local time.
//
// Secrets required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
// SEND_REMINDERS_SECRET, BREVO_API_KEY, EMAIL_FROM (`Name <addr>` or a plain
// address, the sender verified in Brevo) and APP_URL (the app origin, used
// for the link in the email). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are
// injected.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

/** Due rows per run: more than enough for one couple's horizon. */
const BATCH_LIMIT = 200
/** How long sent (and stale unsent) rows are kept for debugging. */
const PRUNE_DAYS = 30
/** Brevo's transactional endpoint — the provider's public API, not a project URL. */
const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email'
/** Sender name used when EMAIL_FROM has no `Name <addr>` part. */
const DEFAULT_SENDER_NAME = 'Nido'

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

interface EmailTarget {
  email: string
  name?: string
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** Event titles and places are user content: they must not break the HTML. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** `Nido <nido@example.com>` or a plain address; a missing name defaults. */
function parseSender(raw: string): { name: string; email: string } {
  const match = raw.match(/^\s*(.+?)\s*<([^<>]+)>\s*$/)
  if (match) return { name: match[1], email: match[2] }
  return { name: DEFAULT_SENDER_NAME, email: raw.trim() }
}

function emailContent(
  row: ReminderRow,
  appUrl: string | null,
): { subject: string; html: string; text: string } {
  const link = appUrl ? `${appUrl}/calendar` : null
  const subject = `Promemoria: ${row.title}`
  const text = [`Promemoria: ${row.title}`, row.body, link ? `Apri il calendario: ${link}` : '']
    .filter(Boolean)
    .join('\n')
  const html = [
    `<p style="margin:0 0 8px"><strong>${escapeHtml(row.title)}</strong></p>`,
    `<p style="margin:0 0 8px">${escapeHtml(row.body)}</p>`,
    link ? `<p style="margin:0"><a href="${escapeHtml(link)}">Apri il calendario</a></p>` : '',
  ].join('')
  return { subject, html, text }
}

async function sendBrevoEmail(
  apiKey: string,
  sender: { name: string; email: string },
  target: EmailTarget,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const response = await fetch(BREVO_SEND_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender,
      to: [target],
      subject,
      htmlContent: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">${html}</div>`,
      textContent: text,
    }),
  })
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300)
    throw new Error(`Brevo ${response.status}: ${detail}`)
  }
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

  const brevoApiKey = Deno.env.get('BREVO_API_KEY')
  const emailFrom = Deno.env.get('EMAIL_FROM')
  const emailConfig =
    brevoApiKey && emailFrom ? { apiKey: brevoApiKey, sender: parseSender(emailFrom) } : null
  if (!emailConfig) {
    console.warn('send-reminders: email channel disabled (set BREVO_API_KEY and EMAIL_FROM)')
  }
  const appUrl = (Deno.env.get('APP_URL') ?? '').replace(/\/+$/, '') || null

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
  let emails = 0

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
    // A broken token table (e.g. a missing column) must not take the email
    // channel down with it: it is logged and the push simply finds nothing.
    const tokens = new Map<string, TokenRow[]>()
    if (userIds.length > 0) {
      const { data, error: tokenError } = await supabase
        .from('push_tokens')
        .select('id, user_id, token, keys')
        .in('user_id', userIds)
      if (tokenError) {
        console.error('send-reminders: push tokens unavailable:', tokenError.message)
      } else {
        for (const token of (data ?? []) as TokenRow[]) {
          const list = tokens.get(token.user_id)
          if (list) list.push(token)
          else tokens.set(token.user_id, [token])
        }
      }
    }

    // Recipient addresses come from Auth; the `to` name from the profile.
    // `notification_prefs.reminders === false` mutes the reminder for that
    // account on both channels (TASK-NOTIF-…-002).
    const emailByUser = new Map<string, EmailTarget>()
    const mutedReminders = new Set<string>()
    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, notification_prefs')
        .in('id', userIds)
      if (profileError) {
        console.warn('send-reminders: profile names unavailable:', profileError.message)
      }
      const nameById = new Map<string, string>()
      for (const profile of profiles ?? []) {
        nameById.set(profile.id, profile.display_name)
        const prefs = (profile.notification_prefs ?? {}) as Record<string, unknown>
        if (prefs.reminders === false) mutedReminders.add(profile.id)
      }

      if (emailConfig) {
        for (const userId of userIds) {
          const { data, error } = await supabase.auth.admin.getUserById(userId)
          const address = data?.user?.email
          if (error || !address) {
            console.error(
              `send-reminders: no email address for ${userId}:`,
              error ?? 'missing email',
            )
            continue
          }
          emailByUser.set(userId, { email: address, name: nameById.get(userId) || undefined })
        }
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
        if (mutedReminders.has(userId)) continue
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
      if (emailConfig) {
        const { subject, html, text } = emailContent(row, appUrl)
        for (const userId of recipients) {
          if (mutedReminders.has(userId)) continue
          const target = emailByUser.get(userId)
          if (!target) continue
          try {
            await sendBrevoEmail(emailConfig.apiKey, emailConfig.sender, target, subject, html, text)
            emails += 1
          } catch (emailError) {
            console.error(
              `send-reminders: email to ${userId} failed for reminder ${row.id}:`,
              emailError,
            )
          }
        }
      }
      // No destination means nothing to deliver: the reminder is spent either
      // way, so a missing device never makes it fire late on a later run.
      sentIds.push(row.id)
    }

    const { error: markError } = await supabase
      .from('push_reminders')
      .update({ sent_at: new Date().toISOString() })
      .in('id', sentIds)
    if (markError) return json({ error: markError.message, sent, emails }, 500)
  }

  const cutoff = new Date(Date.now() - PRUNE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('push_reminders').delete().lt('sent_at', cutoff)
  await supabase.from('push_reminders').delete().is('sent_at', null).lt('fire_at', cutoff)

  return json({ sent, emails, reminders: sentIds.length })
})

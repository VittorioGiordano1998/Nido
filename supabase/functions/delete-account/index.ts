// Supabase Edge Function: delete-account (GDPR).
//
// Deletes the CALLING user's account: the auth user is removed through the
// service role, so the cascades wipe their rows (profiles, couple membership,
// everything created_by/user_id); a couple left with no members is removed
// too, cascading its data. A couple with the partner still in it keeps the
// shared rows. Only the user themselves can trigger this: the JWT is verified
// first (the platform's default verify_jwt = true covers the transport too).
//
// Deploy: `supabase functions deploy delete-account`. No extra secrets.

import { createClient } from 'npm:@supabase/supabase-js@2'

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'unauthorized' }, 401)

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  )
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401)
  const userId = userData.user.id

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: memberships } = await admin
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', userId)
  const coupleIds = (memberships ?? []).map((row) => row.couple_id as string)

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) return json({ error: deleteError.message }, 500)

  let couplesDeleted = 0
  for (const coupleId of coupleIds) {
    const { count } = await admin
      .from('couple_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('couple_id', coupleId)
    if ((count ?? 0) === 0) {
      const { error: coupleError } = await admin.from('couples').delete().eq('id', coupleId)
      if (!coupleError) couplesDeleted += 1
    }
  }

  return json({ deleted: true, couplesDeleted })
})

-- =============================================================================
-- Nido - security hardening (TASK-SEC-VITTORIOGIORDANOYBQ-001)
--
-- Findings of the public-repo audit, database side:
--   1. Invite codes: 12 characters drawn from a CSPRNG (gen_random_uuid is
--      backed by pg_strong_random) instead of 8 from random(); join_couple
--      counts failed attempts per user and locks out after 5 in 15 minutes.
--      Codes already issued (8 characters) keep working.
--   2. Links: attachments and wishlist items accept only http(s) URLs, so a
--      `javascript:` value cannot be stored through the API either. NOT VALID
--      enforces the rule on new writes without scanning legacy rows.
--   3. Nudges: the recipient must be the partner, as for sticky notes.
-- Idempotent.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Invite codes
-- ---------------------------------------------------------------------------

-- Byte 6 of a v4 uuid has fixed high bits and would bias `% 32`; it is skipped.
create or replace function public.generate_invite_code()
returns text
language sql
volatile
as $$
  with r as (
    select decode(replace(gen_random_uuid()::text, '-', ''), 'hex') as b
  )
  select string_agg(
    substr(
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
      (get_byte(r.b, case when i - 1 >= 6 then i else i - 1 end) % 32) + 1,
      1
    ),
    ''
    order by i
  )
  from r, generate_series(1, 12) as i;
$$;

-- Failed join attempts. Written only by join_couple (security definer); RLS is
-- on with no policies, so the API cannot read or touch it.
create table if not exists public.join_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index if not exists join_attempts_user_idx
  on public.join_attempts (user_id, attempted_at);

alter table public.join_attempts enable row level security;

-- A wrong code is recorded and answered with a null couple (raising would roll
-- the attempt back); the client turns the null into "invalid code".
create or replace function public.join_couple(p_code text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple public.couples;
  v_count int;
  v_failures int;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.couple_members where user_id = v_user) then
    raise exception 'already_in_couple';
  end if;

  delete from public.join_attempts
  where user_id = v_user and attempted_at < now() - interval '1 day';

  select count(*) into v_failures
  from public.join_attempts
  where user_id = v_user and attempted_at > now() - interval '15 minutes';
  if v_failures >= 5 then
    raise exception 'too_many_attempts';
  end if;

  select * into v_couple
  from public.couples
  where invite_code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    insert into public.join_attempts (user_id) values (v_user);
    return null;
  end if;

  select count(*) into v_count from public.couple_members where couple_id = v_couple.id;
  if v_count >= 2 then
    raise exception 'couple_full';
  end if;

  insert into public.couple_members (couple_id, user_id) values (v_couple.id, v_user);

  -- complete couple: the invite code is no longer needed
  update public.couples set invite_code = null where id = v_couple.id;
  v_couple.invite_code := null;

  delete from public.join_attempts where user_id = v_user;

  return v_couple;
end;
$$;

revoke execute on function public.join_couple(text) from public, anon;
grant execute on function public.join_couple(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. http(s)-only links
-- ---------------------------------------------------------------------------

alter table public.task_attachments
  drop constraint if exists task_attachments_link_http;
alter table public.task_attachments
  add constraint task_attachments_link_http
  check (kind <> 'link' or value ~* '^https?://') not valid;

alter table public.wishlist_items
  drop constraint if exists wishlist_items_url_http;
alter table public.wishlist_items
  add constraint wishlist_items_url_http
  check (url is null or url ~* '^https?://') not valid;

-- ---------------------------------------------------------------------------
-- 3. Nudges only to the partner
-- ---------------------------------------------------------------------------

drop policy if exists nudges_insert on public.nudges;
create policy nudges_insert on public.nudges
  for insert to authenticated
  with check (
    public.is_couple_member(couple_id)
    and from_user = auth.uid()
    and public.shares_couple_with(to_user)
  );

-- =============================================================================
-- Nido - initial schema (plan section 4)
-- Core (Fase 0) through Fase 4 tables, indexes, triggers and pairing RPCs.
-- RLS policies live in the next migration.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CORE
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text,
  invite_code text unique,
  started_at date,
  premium_tier text check (premium_tier in ('monthly', 'semiannual', 'annual', 'lifetime')),
  premium_until timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.couple_members (
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

create table public.device_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  public_key bytea not null,
  label text,
  created_at timestamptz not null default now()
);

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('web', 'android', 'ios')),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

-- ---------------------------------------------------------------------------
-- FASE 1 - calendar, shared lists, notes
-- ---------------------------------------------------------------------------

create table public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  rrule text,
  visibility text not null default 'couple' check (visibility in ('couple', 'private')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_couple_start_idx on public.events (couple_id, start_at);

create table public.task_lists (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  icon text,
  position int not null default 0,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index task_lists_couple_idx on public.task_lists (couple_id, position);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.task_lists (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  note text,
  done boolean not null default false,
  done_by uuid references public.profiles (id) on delete set null,
  done_at timestamptz,
  due_date date,
  assigned_to uuid references public.profiles (id) on delete set null,
  position int not null default 0,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_list_idx on public.tasks (list_id, position);
create index tasks_couple_idx on public.tasks (couple_id);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text,
  body text,
  pinned_to_widget boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_couple_idx on public.notes (couple_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- FASE 2 - engagement
-- ---------------------------------------------------------------------------

create table public.question_bank (
  id serial primary key,
  lang text not null,
  category text,
  text text not null
);

create table public.daily_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  question_id int not null references public.question_bank (id),
  answer_date date not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  answer text not null,
  answered_at timestamptz not null default now(),
  unique (couple_id, answer_date, user_id)
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  revealed_at timestamptz,
  result jsonb
);
create index decisions_couple_idx on public.decisions (couple_id, created_at desc);

create table public.decision_votes (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  choice jsonb not null,
  voted_at timestamptz not null default now(),
  unique (decision_id, user_id)
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  url text,
  price numeric(12, 2),
  currency text default 'EUR',
  notes text,
  priority int not null default 0,
  purchased boolean not null default false,
  purchased_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index wishlist_couple_idx on public.wishlist_items (couple_id, owner_id);

create table public.partner_facts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  subject_id uuid not null references public.profiles (id) on delete cascade,
  category text,
  label text not null,
  value text,
  updated_by uuid not null references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now()
);
create index partner_facts_couple_idx on public.partner_facts (couple_id, subject_id);

create table public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text,
  body text,
  opens_at date not null,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index time_capsules_couple_idx on public.time_capsules (couple_id, opens_at);

create table public.week_plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  week_start date not null,
  proposal text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'replaced')),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index week_plans_couple_idx on public.week_plans (couple_id, week_start desc);

create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  message text,
  created_at timestamptz not null default now()
);
create index nudges_couple_idx on public.nudges (couple_id, created_at desc);

-- ---------------------------------------------------------------------------
-- FASE 3 - privacy and monetization
-- ---------------------------------------------------------------------------

create table public.vault_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  category text,
  storage_path text not null,
  enc_alg text not null default 'AES-256-GCM',
  enc_nonce bytea not null,
  size_bytes bigint,
  mime text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index vault_items_couple_idx on public.vault_items (couple_id, category);

create table public.vault_keys (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  device_key_id uuid not null references public.device_keys (id) on delete cascade,
  wrapped_key bytea not null,
  created_at timestamptz not null default now()
);

create table public.cycle_logs (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  flow int check (flow between 1 and 5),
  symptoms jsonb not null default '[]'::jsonb,
  mood int check (mood between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table public.cycle_shares (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  period_start date not null,
  period_end date,
  share_level text not null default 'summary' check (share_level in ('summary', 'dates_only')),
  created_at timestamptz not null default now()
);

create table public.savings_projects (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  title text not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) not null default 0,
  currency text not null default 'EUR',
  deadline date,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  store_name text not null,
  code text not null,
  barcode_type text,
  color text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FASE 4 - canvas (live strokes go through Realtime Broadcast, only the PNG
-- is persisted; see plan section 6)
-- ---------------------------------------------------------------------------

create table public.canvases (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  image_path text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

create trigger partner_facts_set_updated_at
  before update on public.partner_facts
  for each row execute function public.set_updated_at();

create trigger savings_projects_set_updated_at
  before update on public.savings_projects
  for each row execute function public.set_updated_at();

create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

create trigger canvases_set_updated_at
  before update on public.canvases
  for each row execute function public.set_updated_at();

-- Profile row for every new auth user (display name from OAuth metadata when
-- present, email prefix otherwise).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- The "max 2 members" invariant. Locks the couple row so two concurrent joins
-- cannot both pass the count check.
create function public.enforce_couple_size()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform 1 from public.couples where id = new.couple_id for update;
  select count(*) into v_count from public.couple_members where couple_id = new.couple_id;
  if v_count >= 2 then
    raise exception 'couple_full';
  end if;
  return new;
end;
$$;

create trigger couple_members_max_two
  before insert on public.couple_members
  for each row execute function public.enforce_couple_size();

-- ---------------------------------------------------------------------------
-- PAIRING RPCs (security definer: all writes to couples / couple_members go
-- through these, never through direct table access)
-- ---------------------------------------------------------------------------

create function public.generate_invite_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', floor(random() * 32)::int + 1, 1),
    ''
  )
  from generate_series(1, 8);
$$;

create function public.create_couple(p_name text default null, p_started_at date default null)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple public.couples;
  v_code text;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.couple_members where user_id = v_user) then
    raise exception 'already_in_couple';
  end if;

  loop
    v_code := public.generate_invite_code();
    begin
      insert into public.couples (name, invite_code, started_at, created_by)
      values (nullif(trim(coalesce(p_name, '')), ''), v_code, p_started_at, v_user)
      returning * into v_couple;
      exit;
    exception when unique_violation then
      -- invite code collision, retry with a fresh code
    end;
  end loop;

  insert into public.couple_members (couple_id, user_id) values (v_couple.id, v_user);
  return v_couple;
end;
$$;

create function public.join_couple(p_code text)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple public.couples;
  v_count int;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.couple_members where user_id = v_user) then
    raise exception 'already_in_couple';
  end if;

  select * into v_couple
  from public.couples
  where invite_code = upper(trim(coalesce(p_code, '')))
  for update;

  if not found then
    raise exception 'invalid_code';
  end if;

  select count(*) into v_count from public.couple_members where couple_id = v_couple.id;
  if v_count >= 2 then
    raise exception 'couple_full';
  end if;

  insert into public.couple_members (couple_id, user_id) values (v_couple.id, v_user);

  -- complete couple: the invite code is no longer needed
  update public.couples set invite_code = null where id = v_couple.id;
  v_couple.invite_code := null;

  return v_couple;
end;
$$;

create function public.leave_couple()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple uuid;
  v_remaining int;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select couple_id into v_couple from public.couple_members where user_id = v_user;
  if v_couple is null then
    raise exception 'not_in_couple';
  end if;

  delete from public.couple_members where couple_id = v_couple and user_id = v_user;

  select count(*) into v_remaining from public.couple_members where couple_id = v_couple;
  if v_remaining = 0 then
    delete from public.couples where id = v_couple;
  else
    -- the remaining partner can invite again
    update public.couples
    set invite_code = public.generate_invite_code()
    where id = v_couple and invite_code is null;
  end if;
end;
$$;

create function public.rotate_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple uuid;
  v_count int;
  v_code text;
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  select couple_id into v_couple from public.couple_members where user_id = v_user;
  if v_couple is null then
    raise exception 'not_in_couple';
  end if;

  select count(*) into v_count from public.couple_members where couple_id = v_couple;
  if v_count >= 2 then
    raise exception 'couple_full';
  end if;

  loop
    v_code := public.generate_invite_code();
    begin
      update public.couples set invite_code = v_code where id = v_couple;
      exit;
    exception when unique_violation then
      -- collision, retry
    end;
  end loop;

  return v_code;
end;
$$;

-- RPCs are for signed-in users only.
revoke execute on function public.create_couple(text, date) from public, anon;
revoke execute on function public.join_couple(text) from public, anon;
revoke execute on function public.leave_couple() from public, anon;
revoke execute on function public.rotate_invite_code() from public, anon;
grant execute on function public.create_couple(text, date) to authenticated;
grant execute on function public.join_couple(text) to authenticated;
grant execute on function public.leave_couple() to authenticated;
grant execute on function public.rotate_invite_code() to authenticated;

-- ---------------------------------------------------------------------------
-- STORAGE BUCKETS (private; contents are encrypted client-side for the vault)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('vault', 'vault', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('canvases', 'canvases', false)
on conflict (id) do nothing;

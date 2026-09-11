-- ============================================================================
-- Staff account management: schema, RLS, and RPC functions
--
-- Makes credentials the super admin (or a hall admin, for technicians in
-- their own hall) generates actually work for sign-in, and makes password
-- resets / edits / deletes from the Staff page actually reach Supabase Auth
-- instead of silently no-op'ing.
--
-- Safe to re-run: tables use IF NOT EXISTS, functions use CREATE OR REPLACE,
-- policies are dropped and recreated.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions needed for password hashing
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- 1. Tables (no-ops if these already exist)
-- ----------------------------------------------------------------------------
create table if not exists public.halls (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  floors integer default 0,
  rooms integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role text not null default 'student'
    check (role in ('student', 'technician', 'hall_admin', 'super_admin')),
  hall_id uuid references public.halls(id),
  specialty text,
  phone text,
  room text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Patch in any columns an existing profiles table might be missing.
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists hall_id uuid;
alter table public.profiles add column if not exists specialty text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists room text;
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- ----------------------------------------------------------------------------
-- 2. Helper functions for RLS policies
--
-- A policy on public.profiles cannot query public.profiles directly in a
-- subquery without risking "infinite recursion detected in policy for
-- relation profiles". These are SECURITY DEFINER, so as functions owned by
-- the table owner they bypass RLS internally and give policies a safe way
-- to ask "what role/hall is the current user?".
-- ----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_hall_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select hall_id from public.profiles where id = auth.uid();
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_hall_id() to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Row Level Security on profiles
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Every signed-in user can read their own row. This is what Login.jsx and
-- App.js's loadSessionUser() rely on right after signInWithPassword().
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = id);

-- Super admins can read every profile (staff directory, student directory).
drop policy if exists "profiles_select_super_admin" on public.profiles;
create policy "profiles_select_super_admin" on public.profiles
  for select
  using (public.current_user_role() = 'super_admin');

-- Hall admins can read profiles (staff + students) in their own hall.
drop policy if exists "profiles_select_hall_admin" on public.profiles;
create policy "profiles_select_hall_admin" on public.profiles
  for select
  using (
    public.current_user_role() = 'hall_admin'
    and hall_id = public.current_user_hall_id()
  );

-- Super admins can update any profile (role changes, hall reassignment,
-- active/inactive toggle from the Staff page).
drop policy if exists "profiles_update_super_admin" on public.profiles;
create policy "profiles_update_super_admin" on public.profiles
  for update
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');

-- Hall admins can update technicians within their own hall only.
drop policy if exists "profiles_update_hall_admin_technicians" on public.profiles;
create policy "profiles_update_hall_admin_technicians" on public.profiles
  for update
  using (
    public.current_user_role() = 'hall_admin'
    and role = 'technician'
    and hall_id = public.current_user_hall_id()
  )
  with check (
    public.current_user_role() = 'hall_admin'
    and role = 'technician'
    and hall_id = public.current_user_hall_id()
  );

-- ----------------------------------------------------------------------------
-- 4. create_staff_account
--
-- Creates a real Supabase Auth user (bcrypt password, email pre-confirmed
-- so sign-in works immediately — auto-generated addresses like
-- name.surname@hall.resifix.com can never click a confirmation link) plus
-- the matching profiles row.
-- ----------------------------------------------------------------------------
drop function if exists public.create_staff_account(text, text, text, text, uuid, text, text);

create or replace function public.create_staff_account(
  p_email text,
  p_password text,
  p_full_name text,
  p_role text,
  p_hall_id uuid,
  p_specialty text default null,
  p_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_caller_role text := public.current_user_role();
  v_caller_hall_id uuid := public.current_user_hall_id();
  v_instance_id uuid;
  v_new_user_id uuid;
begin
  if p_role not in ('hall_admin', 'technician') then
    raise exception 'role must be hall_admin or technician';
  end if;

  if p_role = 'hall_admin' and v_caller_role <> 'super_admin' then
    raise exception 'Only a super admin can create hall admins';
  end if;

  if p_role = 'technician' and v_caller_role not in ('super_admin', 'hall_admin') then
    raise exception 'Only a super admin or hall admin can create technicians';
  end if;

  if v_caller_role = 'hall_admin' and p_hall_id is distinct from v_caller_hall_id then
    raise exception 'Hall admins can only create staff for their own hall';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters long';
  end if;

  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'An account with this email already exists';
  end if;

  select instance_id into v_instance_id from auth.users limit 1;
  if v_instance_id is null then
    v_instance_id := '00000000-0000-0000-0000-000000000000';
  end if;

  v_new_user_id := gen_random_uuid();

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values (
    v_new_user_id,
    v_instance_id,
    'authenticated',
    'authenticated',
    lower(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name)
  );

  -- Some GoTrue versions expect an identities row for email/password
  -- sign-in too. Best-effort: if your project's auth.identities schema
  -- doesn't match this shape, this block is swallowed rather than failing
  -- the whole account creation.
  begin
    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_new_user_id::text,
      v_new_user_id,
      jsonb_build_object('sub', v_new_user_id::text, 'email', lower(p_email)),
      'email',
      now(),
      now(),
      now()
    );
  exception when others then
    null;
  end;

  insert into public.profiles (id, full_name, email, role, hall_id, specialty, phone, is_active)
  values (v_new_user_id, p_full_name, lower(p_email), p_role, p_hall_id, p_specialty, p_phone, true);

  return v_new_user_id;
end;
$$;

grant execute on function public.create_staff_account(text, text, text, text, uuid, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. set_staff_password
--
-- Resets an existing staff account's password. Called from the Staff page's
-- "Reset Credentials" button.
-- ----------------------------------------------------------------------------
drop function if exists public.set_staff_password(uuid, text);

create or replace function public.set_staff_password(
  p_user_id uuid,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_caller_role text := public.current_user_role();
  v_caller_hall_id uuid := public.current_user_hall_id();
  v_target record;
begin
  select role, hall_id into v_target from public.profiles where id = p_user_id;

  if v_target is null then
    raise exception 'No such staff account';
  end if;

  if v_caller_role = 'super_admin' then
    -- allowed
  elsif v_caller_role = 'hall_admin'
        and v_target.role = 'technician'
        and v_target.hall_id = v_caller_hall_id then
    -- allowed
  else
    raise exception 'Not authorized to reset this account''s password';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters long';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
      updated_at = now()
  where id = p_user_id;
end;
$$;

grant execute on function public.set_staff_password(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. delete_staff_account
--
-- Removes both the profile and the underlying Auth user, so a deleted
-- technician/hall admin can no longer sign in.
-- ----------------------------------------------------------------------------
drop function if exists public.delete_staff_account(uuid);

create or replace function public.delete_staff_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caller_role text := public.current_user_role();
  v_caller_hall_id uuid := public.current_user_hall_id();
  v_target record;
begin
  select role, hall_id into v_target from public.profiles where id = p_user_id;

  if v_target is null then
    raise exception 'No such staff account';
  end if;

  if v_caller_role = 'super_admin' then
    -- allowed
  elsif v_caller_role = 'hall_admin'
        and v_target.role = 'technician'
        and v_target.hall_id = v_caller_hall_id then
    -- allowed
  else
    raise exception 'Not authorized to delete this account';
  end if;

  delete from public.profiles where id = p_user_id;
  delete from auth.users where id = p_user_id;
end;
$$;

grant execute on function public.delete_staff_account(uuid) to authenticated;

-- ============================================================================
-- Done. Quick sanity check after running:
--
--   select proname, pg_get_function_identity_arguments(oid)
--   from pg_proc
--   where proname in ('create_staff_account', 'set_staff_password', 'delete_staff_account');
--
-- should list all three with the argument lists used above.
-- ============================================================================

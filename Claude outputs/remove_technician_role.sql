-- ============================================================================
-- Remove the technician role; extend appointments into a real schedule
--
-- Companion to chat_schema_setup.sql. That script created conversations /
-- messages / appointments with a technician-shaped model (a technician
-- assigned to a report, a technician who proposes a slot). The app no longer
-- has a technician role or a Technician Dashboard, so this script:
--
--   1. Refuses to run if any profile still has role = 'technician' (with a
--      commented-out block to clean those up first — see below).
--   2. Drops 'technician' from the profiles role check constraint.
--   3. Simplifies create_staff_account / set_staff_password /
--      delete_staff_account: the only staff role left to create is
--      hall_admin, and only a super admin creates or manages one.
--   4. Reworks public.appointments into an admin-facing schedule: adds
--      status/hall_id/denormalized display columns, renames technician_id
--      to created_by, and updates its RLS so hall_admin/super_admin can
--      list, create, and update appointments (mark completed/cancelled).
--   5. Drops the technician branch from can_access_report(), which
--      conversations/messages/appointments all key off of.
--
-- Safe to re-run: guards check current state before altering it.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Refuse to proceed if technician accounts still exist
--
-- Dropping the role from the check constraint would otherwise leave those
-- rows violating it (or silently orphan their sign-ins, depending on how
-- Postgres applies the new constraint). Reassign or remove them first.
-- ----------------------------------------------------------------------------
do $$
declare
  v_count int;
begin
  select count(*) into v_count from public.profiles where role = 'technician';
  if v_count > 0 then
    raise exception
      'Refusing to drop the technician role: % profile(s) still have role = ''technician''. '
      'Reassign them to another role, or uncomment and run the cleanup block in section 0b '
      'of this script, then re-run.', v_count;
  end if;
end $$;

-- 0b. Uncomment to permanently delete every remaining technician account
-- (Supabase Auth user + profile row) before dropping the role. There is no
-- undo — export anything you need from these accounts first.
--
-- do $$
-- declare
--   v_id uuid;
-- begin
--   for v_id in select id from public.profiles where role = 'technician' loop
--     perform public.delete_staff_account(v_id);
--   end loop;
-- end $$;

-- ----------------------------------------------------------------------------
-- 1. profiles.role: drop 'technician'
-- ----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'hall_admin', 'super_admin'));

-- This policy let a hall_admin update technician profiles in their hall.
-- With no technician role left it can never match a row, so it's dropped
-- rather than left as dead policy clutter. Hall admins no longer manage any
-- staff profile but their own (see the RPC changes below).
drop policy if exists "profiles_update_hall_admin_technicians" on public.profiles;

-- ----------------------------------------------------------------------------
-- 2. create_staff_account: only hall_admin, only a super admin creates one
-- ----------------------------------------------------------------------------
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
  v_instance_id uuid;
  v_new_user_id uuid;
begin
  if p_role <> 'hall_admin' then
    raise exception 'role must be hall_admin';
  end if;

  if v_caller_role <> 'super_admin' then
    raise exception 'Only a super admin can create hall admins';
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

  -- specialty is no longer a real concept (that was the technician's line of
  -- work); the parameter stays for call-site compatibility but is ignored.
  insert into public.profiles (id, full_name, email, role, hall_id, specialty, phone, is_active)
  values (v_new_user_id, p_full_name, lower(p_email), p_role, p_hall_id, null, p_phone, true);

  return v_new_user_id;
end;
$$;

grant execute on function public.create_staff_account(text, text, text, text, uuid, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 3. set_staff_password / delete_staff_account: super admin only now
--
-- The old hall_admin branch only ever covered resetting/deleting a
-- technician in their own hall. With no technician role left, a hall admin
-- has no staff account to manage but their own — so only super_admin acts
-- here.
-- ----------------------------------------------------------------------------
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
begin
  if v_caller_role <> 'super_admin' then
    raise exception 'Not authorized to reset this account''s password';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'No such staff account';
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

create or replace function public.delete_staff_account(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caller_role text := public.current_user_role();
begin
  if v_caller_role <> 'super_admin' then
    raise exception 'Not authorized to delete this account';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'No such staff account';
  end if;

  delete from public.profiles where id = p_user_id;
  delete from auth.users where id = p_user_id;
end;
$$;

grant execute on function public.delete_staff_account(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. can_access_report(): drop the technician branch
--
-- Reused by conversations/messages/appointments RLS below, so this alone
-- changes what all three tables allow once redefined.
-- ----------------------------------------------------------------------------
create or replace function public.can_access_report(p_report_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.reports r
    where r.id = p_report_id
      and (
        public.current_user_role() = 'super_admin'
        or (public.current_user_role() = 'hall_admin' and r.hall_id = public.current_user_hall_id())
        or (public.current_user_role() = 'student' and r.student_id = auth.uid())
      )
  );
$$;

-- ----------------------------------------------------------------------------
-- 5. appointments: reshape into an admin-facing schedule
--
-- Adds the columns an Appointment Schedule page needs (status to filter by,
-- hall_id to scope by hall, denormalized display fields matching the
-- convention reports already uses), and renames technician_id — the
-- technician who proposed the slot — to created_by, since scheduling is now
-- a hall_admin/super_admin action.
-- ----------------------------------------------------------------------------

-- Table may not exist yet if chat_schema_setup.sql was never run — create it
-- directly in the final shape so this script also works standalone.
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete set null,
  student_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  hall_id uuid references public.halls(id) on delete set null,
  hall_name text,
  student_name text,
  report_category text,
  report_issue text,
  title text,
  slot_label text,
  scheduled_for timestamptz,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

-- Upgrade path from the shape chat_schema_setup.sql originally created.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'appointments' and column_name = 'technician_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'appointments' and column_name = 'created_by'
  ) then
    alter table public.appointments rename column technician_id to created_by;
  end if;
end $$;

-- Upgrade path for the minimal appointments table actually found in this
-- project (id, student_id, report_id, title, scheduled_for, status,
-- created_at only — no technician_id to rename from, so created_by must be
-- added outright).
alter table public.appointments add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.appointments add column if not exists hall_id uuid references public.halls(id) on delete set null;
alter table public.appointments add column if not exists hall_name text;
alter table public.appointments add column if not exists student_name text;
alter table public.appointments add column if not exists report_category text;
alter table public.appointments add column if not exists report_issue text;
alter table public.appointments add column if not exists slot_label text;
alter table public.appointments add column if not exists status text;

update public.appointments set status = 'scheduled' where status is null;
alter table public.appointments alter column status set default 'scheduled';
alter table public.appointments alter column status set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'appointments_status_check') then
    alter table public.appointments add constraint appointments_status_check
      check (status in ('scheduled', 'completed', 'cancelled'));
  end if;
end $$;

create index if not exists appointments_report_idx on public.appointments (report_id);
create index if not exists appointments_hall_idx on public.appointments (hall_id);
create index if not exists appointments_status_idx on public.appointments (status);
create index if not exists appointments_scheduled_for_idx on public.appointments (scheduled_for);

alter table public.appointments enable row level security;

grant select, insert, update on public.appointments to authenticated;

drop policy if exists "appointments_select" on public.appointments;
create policy "appointments_select" on public.appointments
  for select
  using (
    student_id = auth.uid()
    or created_by = auth.uid()
    or public.current_user_role() = 'super_admin'
    or (public.current_user_role() = 'hall_admin' and hall_id = public.current_user_hall_id())
    or (report_id is not null and public.can_access_report(report_id))
  );

drop policy if exists "appointments_insert" on public.appointments;
create policy "appointments_insert" on public.appointments
  for insert
  with check (
    public.current_user_role() in ('hall_admin', 'super_admin')
    and created_by = auth.uid()
    and (report_id is null or public.can_access_report(report_id))
  );

-- New: admins mark an appointment completed/cancelled, or reschedule it.
drop policy if exists "appointments_update" on public.appointments;
create policy "appointments_update" on public.appointments
  for update
  using (
    public.current_user_role() = 'super_admin'
    or (public.current_user_role() = 'hall_admin' and hall_id = public.current_user_hall_id())
  )
  with check (
    public.current_user_role() = 'super_admin'
    or (public.current_user_role() = 'hall_admin' and hall_id = public.current_user_hall_id())
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end $$;

-- ============================================================================
-- Done. Quick sanity checks after running:
--
--   -- no technician accounts, constraint no longer allows them
--   select count(*) from public.profiles where role = 'technician';
--   select pg_get_constraintdef(oid) from pg_constraint where conname = 'profiles_role_check';
--
--   -- appointments has the new shape
--   select column_name, data_type from information_schema.columns
--   where table_schema = 'public' and table_name = 'appointments'
--   order by ordinal_position;
--
--   -- policies exist
--   select tablename, policyname, cmd from pg_policies
--   where tablename = 'appointments' order by policyname;
-- ============================================================================

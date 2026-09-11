-- ============================================================================
-- Student <-> Technician chat: schema, RLS, and realtime
--
-- Backs the "Live Chat with Student" panel in TechnicianDashboard.jsx and the
-- mobile app's ChatScreen. Both apps already call these tables through
-- src/data/store.js (getConversationForReport, fetchMessages, sendMessage,
-- subscribeToMessages) — this script is what makes those calls work.
--
-- Model: one conversation per maintenance report, many messages per
-- conversation. A student can only see conversations on their own reports;
-- a technician only on reports assigned to them; hall admins within their
-- hall; super admins everything. Same shape as the reports table's own RLS,
-- reused here via a SECURITY DEFINER helper so the policy can't recurse.
--
-- Safe to re-run: tables use IF NOT EXISTS, functions use CREATE OR REPLACE,
-- policies and the realtime publication membership are dropped/checked
-- before being (re)created.
--
-- Assumes public.reports and public.profiles already exist (they do — the
-- rest of the dashboard depends on them) with uuid primary keys, matching
-- public.halls / public.profiles.id elsewhere in this project. If your
-- reports.id is a different type, adjust the FK columns below to match
-- before running this.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tables
-- ----------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete set null,
  staff_id uuid references public.profiles(id) on delete set null,
  subject text,
  created_at timestamptz not null default now()
);

-- One conversation per report — getConversationForReport() in store.js
-- relies on this being true (it selects by report_id before inserting).
create unique index if not exists conversations_report_id_key
  on public.conversations (report_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_name text,
  sender_role text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

-- Also written to from the chat panel: handleSuggestAppointmentInChat() in
-- TechnicianDashboard.jsx posts a chat message *and* calls
-- createAppointment(), so this table is part of the same flow.
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete set null,
  student_id uuid references public.profiles(id) on delete set null,
  technician_id uuid references public.profiles(id) on delete set null,
  title text,
  slot_label text,
  scheduled_for timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists appointments_report_idx on public.appointments (report_id);
create index if not exists appointments_technician_idx on public.appointments (technician_id);

-- ----------------------------------------------------------------------------
-- 2. Helper: can the signed-in user see/act on this report's conversation?
--
-- Mirrors whatever RLS already exists on public.reports (student owns it /
-- technician is assigned / hall admin's hall / super admin sees all).
-- SECURITY DEFINER so this can read public.reports without depending on the
-- caller's own SELECT policy on that table, and without a policy on
-- conversations/messages ever querying reports directly (which is how you
-- get "infinite recursion detected in policy" in Postgres).
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
        or (public.current_user_role() = 'technician' and r.assigned_to = auth.uid())
        or (public.current_user_role() = 'student' and r.student_id = auth.uid())
      )
  );
$$;

grant execute on function public.can_access_report(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;

-- Conversations: readable/creatable by anyone who can access the underlying
-- report. No update/delete policy is defined, so both are denied by default
-- — a conversation's report_id/student_id shouldn't change after creation.
drop policy if exists "conversations_select" on public.conversations;
create policy "conversations_select" on public.conversations
  for select
  using (public.can_access_report(report_id));

drop policy if exists "conversations_insert" on public.conversations;
create policy "conversations_insert" on public.conversations
  for insert
  with check (public.can_access_report(report_id));

-- Messages: readable by anyone who can access the parent conversation's
-- report. Insert additionally forces sender_id/sender_role to match the
-- caller, so a client can't post a message pretending to be someone else.
-- No update/delete policy — the chat log is immutable, matching
-- handleClearChat()'s "cannot be cleared" message in the technician UI.
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and public.can_access_report(c.report_id)
    )
  );

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert
  with check (
    sender_id = auth.uid()
    and sender_role = public.current_user_role()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and public.can_access_report(c.report_id)
    )
  );

-- Appointments: same report-based visibility, plus the two people the
-- appointment is actually for. Only staff (never a student) can create one.
drop policy if exists "appointments_select" on public.appointments;
create policy "appointments_select" on public.appointments
  for select
  using (
    student_id = auth.uid()
    or technician_id = auth.uid()
    or (report_id is not null and public.can_access_report(report_id))
  );

drop policy if exists "appointments_insert" on public.appointments;
create policy "appointments_insert" on public.appointments
  for insert
  with check (
    public.current_user_role() in ('technician', 'hall_admin', 'super_admin')
    and (report_id is null or public.can_access_report(report_id))
  );

-- ----------------------------------------------------------------------------
-- 4. Table privileges
--
-- Belt-and-suspenders alongside RLS: Postgres checks the GRANT before RLS
-- policies are ever evaluated. Harmless to re-run if your project already
-- grants these by default.
-- ----------------------------------------------------------------------------
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert on public.appointments to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Realtime
--
-- subscribeToMessages() in store.js listens for postgres_changes on
-- public.messages. That only fires if the table is in the supabase_realtime
-- publication — added guardedly so re-running this script doesn't error on
-- "relation is already member of publication".
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

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
--   -- tables + RLS are on
--   select relname, relrowsecurity
--   from pg_class
--   where relname in ('conversations', 'messages', 'appointments');
--
--   -- policies exist
--   select tablename, policyname, cmd
--   from pg_policies
--   where tablename in ('conversations', 'messages', 'appointments')
--   order by tablename, policyname;
--
--   -- realtime is on
--   select schemaname, tablename
--   from pg_publication_tables
--   where pubname = 'supabase_realtime'
--     and tablename in ('conversations', 'messages', 'appointments');
-- ============================================================================

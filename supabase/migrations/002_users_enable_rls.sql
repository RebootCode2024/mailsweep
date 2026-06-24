-- 002_users_enable_rls.sql
--
-- Enable Row Level Security on public.users.
--
-- Context: when the table was created in migration 001 we deliberately left
-- RLS off because the only access path is our two edge functions
-- (validate-user, gumroad-webhook), both of which authenticate as
-- service_role and bypass RLS anyway. Supabase Advisors flagged the disabled
-- RLS as a default-public-table risk, and they have a point: the security
-- model relied on the publishable key (`sb_publishable_*`) never leaking.
--
-- This migration adds defense-in-depth. Service-role calls (our edge
-- functions) continue to work; any other key — including a leaked
-- publishable / anon key — is now blocked at the database layer.
--
-- Apply via Supabase Dashboard → SQL Editor (or `supabase db push` if the
-- CLI is connected to the linked project).

alter table public.users enable row level security;

-- One permissive policy that grants service_role full access to everything.
-- Without this, even service_role would be denied once RLS is on — Supabase's
-- service_role does bypass RLS by default, but an explicit policy keeps the
-- intent visible and audit-friendly.
create policy "Service role only — full access"
on public.users
as permissive
for all
to service_role
using (true)
with check (true);

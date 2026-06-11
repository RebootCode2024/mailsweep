-- MailSweep: users table for trial + paid-license tracking
create table public.users (
  email_id         text primary key,
  trial_start_date date default current_date,
  last_delete_date date,
  trial_days_used  integer default 0,
  is_paid          boolean default false,
  is_blocked       boolean default false,
  created_at       timestamptz default now()
);

-- RLS is disabled because the only access path is via the
-- validate-user edge function, which uses the secret key.
-- No client (Apps Script with publishable key) can hit this table.
alter table public.users disable row level security;

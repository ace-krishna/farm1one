-- FarmOne: vaccinations table (one row per dose that was marked as done)
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- The animals table (supabase/schema.sql) must already exist.

create table if not exists public.vaccinations (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid not null references public.animals (id) on delete cascade,  -- links to the animal's uuid
  owner_id    uuid null,                  -- filled in when login is added
  rule_id     text not null,              -- id from vaccineRules.js, e.g. 'cb-fmd'
  dose_index  integer not null check (dose_index >= 0),  -- which dose of that rule (0 = first dose, then booster, then repeats)
  rule_name   text not null,              -- vaccine name at the time it was given, e.g. 'FMD'
  dose_label  text not null,              -- e.g. 'First dose', 'Booster'
  given_on    date not null,              -- the date the dose was actually given
  created_at  timestamptz not null default now(),

  -- the same dose of the same animal can only be marked done once
  constraint vaccinations_one_per_dose unique (animal_id, rule_id, dose_index)
);

create index if not exists vaccinations_animal_id_idx on public.vaccinations (animal_id);
create index if not exists vaccinations_owner_id_idx on public.vaccinations (owner_id);

-- Row Level Security
alter table public.vaccinations enable row level security;

-- TEMPORARY open policy: anyone with the app key can read and write. Only OK while there is no login.
drop policy if exists "temporary open access" on public.vaccinations;
create policy "temporary open access"
  on public.vaccinations
  for all
  using (true)
  with check (true);

-- WHEN LOGIN IS ADDED: delete the temporary policy above and use this instead:
--
--   drop policy "temporary open access" on public.vaccinations;
--   create policy "owners manage their own vaccinations"
--     on public.vaccinations
--     for all
--     to authenticated
--     using (owner_id = auth.uid())
--     with check (owner_id = auth.uid());

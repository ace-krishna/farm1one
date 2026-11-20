-- FarmOne: animals table
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.animals (
  id          uuid primary key default gen_random_uuid(),  -- other tables (vaccinations, farm log, scan reports) will link to this id
  owner_id    uuid null,                                    -- filled in when login is added; later: references auth.users(id)
  name        text,
  ear_tag     text,
  species     text not null check (species in ('cow', 'buffalo', 'goat', 'hen')),
  breed       text,                                         -- cow only: 'indigenous' or 'crossbred'
  coat_color  text not null,
  hen_purpose text,                                         -- hen only: 'layer' or 'broiler'
  dob         date not null,                                -- always a real date of birth (needed for vaccine reminders)
  sex         text not null check (sex in ('male', 'female')),
  created_at  timestamptz not null default now(),

  -- name or ear tag (at least one)
  constraint animals_name_or_ear_tag check (
    nullif(btrim(coalesce(name, '')), '') is not null
    or nullif(btrim(coalesce(ear_tag, '')), '') is not null
  ),
  -- breed: required for cow, empty for every other species
  constraint animals_breed_rule check (
    (species = 'cow' and breed in ('indigenous', 'crossbred'))
    or (species <> 'cow' and breed is null)
  ),
  -- hen_purpose: required for hen, empty for every other species
  constraint animals_hen_purpose_rule check (
    (species = 'hen' and hen_purpose in ('layer', 'broiler'))
    or (species <> 'hen' and hen_purpose is null)
  )
);

create index if not exists animals_owner_id_idx on public.animals (owner_id);

-- Row Level Security
alter table public.animals enable row level security;

-- TEMPORARY open policy: anyone with the app key can read and write every animal.
-- This is only OK while there is no login.
drop policy if exists "temporary open access" on public.animals;
create policy "temporary open access"
  on public.animals
  for all
  using (true)
  with check (true);

-- WHEN LOGIN IS ADDED: delete the temporary policy above and use this instead,
-- so each user only sees and changes their own animals:
--
--   drop policy "temporary open access" on public.animals;
--   create policy "owners manage their own animals"
--     on public.animals
--     for all
--     to authenticated
--     using (owner_id = auth.uid())
--     with check (owner_id = auth.uid());

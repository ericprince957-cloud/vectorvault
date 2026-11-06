
-- =========================================================
-- VECTORVAULT DATABASE
-- Built for the current Next.js + Supabase application
-- Run this in the Supabase SQL Editor on a fresh project.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  full_name text,
  bio text,
  avatar_url text,
  website text,
  location text,
  skills text[] not null default '{}',
  github_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_username_format
    check (username ~ '^[a-z0-9_]{3,30}$')
);

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));


-- ---------------------------------------------------------
-- 2. REPOSITORIES
-- ---------------------------------------------------------

create table if not exists public.repositories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint repositories_visibility_check
    check (visibility in ('public', 'private')),

  constraint repositories_name_format
    check (name ~ '^[a-zA-Z0-9_-]{1,100}$')
);

create index if not exists repositories_owner_id_idx
  on public.repositories(owner_id);

create index if not exists repositories_visibility_idx
  on public.repositories(visibility);


-- ---------------------------------------------------------
-- 3. REPOSITORY FILES
-- ---------------------------------------------------------

create table if not exists public.repository_files (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null
    references public.repositories(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  file_size bigint not null default 0,
  created_at timestamptz not null default now(),

  constraint repository_files_size_check
    check (file_size >= 0),

  constraint repository_files_name_check
    check (char_length(file_name) between 1 and 255)
);

create index if not exists repository_files_repository_id_idx
  on public.repository_files(repository_id);


-- ---------------------------------------------------------
-- 4. STARS
-- ---------------------------------------------------------

create table if not exists public.stars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  repository_id uuid not null
    references public.repositories(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint stars_user_repository_unique
    unique (user_id, repository_id)
);

create index if not exists stars_repository_id_idx
  on public.stars(repository_id);


-- ---------------------------------------------------------
-- 5. FOLLOWERS
-- ---------------------------------------------------------

create table if not exists public.followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null
    references public.profiles(id) on delete cascade,
  following_id uuid not null
    references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint followers_unique_pair
    unique (follower_id, following_id),

  constraint followers_no_self_follow
    check (follower_id <> following_id)
);

create index if not exists followers_following_id_idx
  on public.followers(following_id);


-- ---------------------------------------------------------
-- 6. UPDATED_AT TRIGGER
-- ---------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at
  on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists repositories_set_updated_at
  on public.repositories;

create trigger repositories_set_updated_at
before update on public.repositories
for each row execute function public.set_updated_at();


-- ---------------------------------------------------------
-- 7. AUTOMATIC PROFILE CREATION ON SIGNUP
-- ---------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_username text;
  fallback_username text;
  chosen_full_name text;
begin
  chosen_username := lower(
    coalesce(new.raw_user_meta_data ->> 'username', '')
  );

  chosen_full_name := nullif(
    trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')),
    ''
  );

  -- Validate the username received from signup metadata.
  if chosen_username !~ '^[a-z0-9_]{3,30}$' then
    chosen_username := 'user_' ||
      replace(new.id::text, '-', '')::text;
    chosen_username := left(chosen_username, 30);
  end if;

  fallback_username := left(
    'user_' || replace(new.id::text, '-', ''),
    30
  );

  -- Retry with a unique ID-based username if the requested
  -- username is already taken.
  begin
    insert into public.profiles (id, username, full_name)
    values (new.id, chosen_username, chosen_full_name);

  exception when unique_violation then
    insert into public.profiles (id, username, full_name)
    values (new.id, fallback_username, chosen_full_name);
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- ---------------------------------------------------------
-- 8. ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.repositories enable row level security;
alter table public.repository_files enable row level security;
alter table public.stars enable row level security;
alter table public.followers enable row level security;


-- ---------------------------------------------------------
-- 9. PROFILES POLICIES
-- ---------------------------------------------------------

drop policy if exists "Profiles are publicly readable"
  on public.profiles;

create policy "Profiles are publicly readable"
on public.profiles
for select
to anon, authenticated
using (true);


drop policy if exists "Users can update their own profile"
  on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));


drop policy if exists "Users can delete their own profile"
  on public.profiles;

create policy "Users can delete their own profile"
on public.profiles
for delete
to authenticated
using (id = (select auth.uid()));


-- ---------------------------------------------------------
-- 10. REPOSITORY POLICIES
-- ---------------------------------------------------------

drop policy if exists "Public repositories and owners are readable"
  on public.repositories;

create policy "Public repositories and owners are readable"
on public.repositories
for select
to anon, authenticated
using (
  visibility = 'public'
  or owner_id = (select auth.uid())
);


drop policy if exists "Users can create their own repositories"
  on public.repositories;

create policy "Users can create their own repositories"
on public.repositories
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
);


drop policy if exists "Owners can update their repositories"
  on public.repositories;

create policy "Owners can update their repositories"
on public.repositories
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));


drop policy if exists "Owners can delete their repositories"
  on public.repositories;

create policy "Owners can delete their repositories"
on public.repositories
for delete
to authenticated
using (owner_id = (select auth.uid()));


-- ---------------------------------------------------------
-- 11. REPOSITORY FILE METADATA POLICIES
-- ---------------------------------------------------------

drop policy if exists "Repository files follow repository visibility"
  on public.repository_files;

create policy "Repository files follow repository visibility"
on public.repository_files
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.repositories r
    where r.id = repository_files.repository_id
      and (
        r.visibility = 'public'
        or r.owner_id = (select auth.uid())
      )
  )
);


drop policy if exists "Owners can add repository file metadata"
  on public.repository_files;

create policy "Owners can add repository file metadata"
on public.repository_files
for insert
to authenticated
with check (
  exists (
    select 1
    from public.repositories r
    where r.id = repository_files.repository_id
      and r.owner_id = (select auth.uid())
      and (storage.foldername(repository_files.storage_path))[1]
          = r.owner_id::text
      and (storage.foldername(repository_files.storage_path))[2]
          = r.id::text
  )
);


drop policy if exists "Owners can delete repository file metadata"
  on public.repository_files;

create policy "Owners can delete repository file metadata"
on public.repository_files
for delete
to authenticated
using (
  exists (
    select 1
    from public.repositories r
    where r.id = repository_files.repository_id
      and r.owner_id = (select auth.uid())
  )
);


-- ---------------------------------------------------------
-- 12. STAR POLICIES
-- ---------------------------------------------------------

drop policy if exists "Stars on visible repositories are readable"
  on public.stars;

create policy "Stars on visible repositories are readable"
on public.stars
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.repositories r
    where r.id = stars.repository_id
      and (
        r.visibility = 'public'
        or r.owner_id = (select auth.uid())
      )
  )
);


drop policy if exists "Users can star public repositories"
  on public.stars;

create policy "Users can star public repositories"
on public.stars
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.repositories r
    where r.id = stars.repository_id
      and r.visibility = 'public'
  )
);


drop policy if exists "Users can remove their own stars"
  on public.stars;

create policy "Users can remove their own stars"
on public.stars
for delete
to authenticated
using (user_id = (select auth.uid()));


-- ---------------------------------------------------------
-- 13. FOLLOWER POLICIES
-- ---------------------------------------------------------

drop policy if exists "Follower relationships are publicly readable"
  on public.followers;

create policy "Follower relationships are publicly readable"
on public.followers
for select
to anon, authenticated
using (true);


drop policy if exists "Users can follow other profiles"
  on public.followers;

create policy "Users can follow other profiles"
on public.followers
for insert
to authenticated
with check (
  follower_id = (select auth.uid())
  and follower_id <> following_id
);


drop policy if exists "Users can unfollow from their own account"
  on public.followers;

create policy "Users can unfollow from their own account"
on public.followers
for delete
to authenticated
using (follower_id = (select auth.uid()));


-- ---------------------------------------------------------
-- 14. STORAGE BUCKETS
-- ---------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('repo-files', 'repo-files', false),
  ('avatars', 'avatars', true)
on conflict (id) do update
set public = excluded.public;


-- ---------------------------------------------------------
-- 15. STORAGE POLICIES: REPOSITORY FILES
-- File path format:
-- user-id/repository-id/file-name
-- ---------------------------------------------------------

drop policy if exists "Owners can upload repository files"
  on storage.objects;

create policy "Owners can upload repository files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'repo-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.repositories r
    where r.id::text = (storage.foldername(name))[2]
      and r.owner_id = (select auth.uid())
  )
);


drop policy if exists "Users can read permitted repository files"
  on storage.objects;

create policy "Users can read permitted repository files"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'repo-files'
  and exists (
    select 1
    from public.repositories r
    where r.id::text = (storage.foldername(name))[2]
      and r.owner_id::text = (storage.foldername(name))[1]
      and (
        r.visibility = 'public'
        or r.owner_id = (select auth.uid())
      )
  )
);


drop policy if exists "Owners can delete repository files"
  on storage.objects;

create policy "Owners can delete repository files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'repo-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.repositories r
    where r.id::text = (storage.foldername(name))[2]
      and r.owner_id = (select auth.uid())
  )
);


-- ---------------------------------------------------------
-- 16. STORAGE POLICIES: AVATARS
-- ---------------------------------------------------------

drop policy if exists "Users can upload their own avatars"
  on storage.objects;

create policy "Users can upload their own avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);


drop policy if exists "Anyone can view avatars"
  on storage.objects;

create policy "Anyone can view avatars"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');


drop policy if exists "Users can update their own avatars"
  on storage.objects;

create policy "Users can update their own avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);


drop policy if exists "Users can delete their own avatars"
  on storage.objects;

create policy "Users can delete their own avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);


-- ---------------------------------------------------------
-- 17. TABLE PERMISSIONS
-- Row Level Security policies still control which rows
-- each user can access.
-- ---------------------------------------------------------

grant select on public.profiles to anon, authenticated;
grant update, delete on public.profiles to authenticated;

grant select on public.repositories to anon, authenticated;
grant insert, update, delete on public.repositories to authenticated;

grant select on public.repository_files to anon, authenticated;
grant insert, delete on public.repository_files to authenticated;

grant select on public.stars to anon, authenticated;
grant insert, delete on public.stars to authenticated;

grant select on public.followers to anon, authenticated;
grant insert, delete on public.followers to authenticated;

commit;

-- =========================================================
-- VECTORVAULT DATABASE SETUP COMPLETE
-- =========================================================

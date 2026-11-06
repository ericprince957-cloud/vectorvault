-- ============================================================
-- VectorVault — Database schema, RLS policies and triggers
-- Run this in the Supabase SQL Editor (SQL > New query).
-- ============================================================

-- ---------- TABLES ----------

-- 1. Profiles (public developer information)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 30),
  full_name text,
  bio text,
  avatar_url text,
  website text,
  location text,
  skills text[],
  github_url text,
  created_at timestamptz not null default now()
);

-- 2. Repositories
create table if not exists public.repositories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- 3. Repository files (metadata for uploaded files)
create table if not exists public.repository_files (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);

-- 4. Stars
create table if not exists public.stars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, repository_id)
);

-- 5. Followers
create table if not exists public.followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists repositories_owner_idx on public.repositories (owner_id);
create index if not exists repository_files_repo_idx on public.repository_files (repository_id);

-- ---------- ROW LEVEL SECURITY ----------

alter table public.profiles enable row level security;
alter table public.repositories enable row level security;
alter table public.repository_files enable row level security;
alter table public.stars enable row level security;
alter table public.followers enable row level security;

-- Profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete using (auth.uid() = id);

-- Repositories
create policy "Public repositories are viewable by everyone"
  on public.repositories for select
  using (visibility = 'public' or owner_id = auth.uid());

create policy "Owners can create repositories"
  on public.repositories for insert with check (owner_id = auth.uid());

create policy "Owners can update their repositories"
  on public.repositories for update using (owner_id = auth.uid());

create policy "Owners can delete their repositories"
  on public.repositories for delete using (owner_id = auth.uid());

-- Repository files (inherit repository visibility)
create policy "Files are viewable when their repository is viewable"
  on public.repository_files for select
  using (
    exists (
      select 1 from public.repositories r
      where r.id = repository_id
        and (r.visibility = 'public' or r.owner_id = auth.uid())
    )
  );

create policy "Owners can add files to their repositories"
  on public.repository_files for insert
  with check (
    exists (
      select 1 from public.repositories r
      where r.id = repository_id and r.owner_id = auth.uid()
    )
  );

create policy "Owners can delete files from their repositories"
  on public.repository_files for delete
  using (
    exists (
      select 1 from public.repositories r
      where r.id = repository_id and r.owner_id = auth.uid()
    )
  );

-- Stars
create policy "Stars are viewable by everyone"
  on public.stars for select using (
    exists (
      select 1 from public.repositories r
      where r.id = repository_id
        and (r.visibility = 'public' or r.owner_id = auth.uid())
    )
  );

create policy "Users can star repositories"
  on public.stars for insert with check (auth.uid() = user_id);

create policy "Users can unstar repositories"
  on public.stars for delete using (auth.uid() = user_id);

-- Followers
create policy "Follow relationships are viewable by everyone"
  on public.followers for select using (true);

create policy "Users can follow developers"
  on public.followers for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow developers"
  on public.followers for delete using (auth.uid() = follower_id);

-- ---------- AUTO-CREATE PROFILE ON SIGNUP ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- STORAGE BUCKETS ----------

-- Repository files: private bucket (access only via signed URLs + policies)
insert into storage.buckets (id, name, public)
values ('repo-files', 'repo-files', false)
on conflict (id) do nothing;

-- Avatars: public read bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage: users manage files inside their own folder (folder = user id)
create policy "Users can upload into their own folder"
  on storage.objects for insert
  with check (
    bucket_id in ('repo-files', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own files"
  on storage.objects for select
  using (
    bucket_id = 'repo-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own files"
  on storage.objects for delete
  using (
    bucket_id in ('repo-files', 'avatars')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public repo files: readable when the owning repo is public or owned by the user
create policy "Public repository files are readable"
  on storage.objects for select
  using (
    bucket_id = 'repo-files'
    and exists (
      select 1 from public.repositories r
      where r.owner_id::text = (storage.foldername(name))[1]
        and (r.visibility = 'public' or r.owner_id = auth.uid())
    )
  );

-- Avatars are public read
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

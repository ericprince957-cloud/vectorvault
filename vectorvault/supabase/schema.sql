-- =========================================================
-- VECTORVAULT DATABASE
-- Built for the current Next.js + Supabase application
-- Run this in the Supabase SQL Editor on a fresh project.
-- This baseline consolidates the original schema plus the
-- collaboration foundation and policy cleanup migrations,
-- so it matches the current live database.
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
  topics text[] not null default '{}',
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
  file_path text,
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
-- VECTORVAULT DATABASE SETUP COMPLETE (BASE SCHEMA)
-- The collaboration foundation and policy cleanup sections
-- below bring this baseline up to the current live schema.
-- =========================================================

-- =========================================================
-- 18. COLLABORATION FOUNDATION (migration 20261111111944)
-- =========================================================

-- =========================================================
-- VECTORVAULT — 20261111111944_vectorvault_collaboration_foundation
--
-- Applied to the live Supabase project as migration
-- "20261111111944 — vectorvault_collaboration_foundation".
-- This file records that migration for version control.
--
-- DO NOT re-apply blindly: the live project already contains
-- these changes. Diff against the live schema before running.
--
-- Contents:
--   1. Repository topics column
--   2. repository_collaborators (invitations + membership)
--   3. issues
--   4. issue_comments
--   5. notifications
--   6. Integrity triggers
--   7. Security-definer access helpers (avoid policy recursion)
--   8. Notification generation (trusted database functions)
--   9. RLS policies for the new tables
--  10. Updated policies: repositories, repository_files, storage
--  11. Grants
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. REPOSITORY TOPICS
-- ---------------------------------------------------------

alter table public.repositories
  add column if not exists topics text[] not null default '{}';

create index if not exists repositories_topics_idx
  on public.repositories using gin (topics);


-- ---------------------------------------------------------
-- 2. REPOSITORY COLLABORATORS
-- ---------------------------------------------------------

create table if not exists public.repository_collaborators (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null
    references public.repositories(id) on delete cascade,
  user_id uuid not null
    references public.profiles(id) on delete cascade,
  role text not null default 'read',
  invited_by uuid
    references public.profiles(id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint repository_collaborators_role_check
    check (role in ('read', 'write', 'admin')),

  constraint repository_collaborators_status_check
    check (status in ('pending', 'accepted', 'declined')),

  constraint repository_collaborators_unique
    unique (repository_id, user_id)
);

create index if not exists repository_collaborators_repository_id_idx
  on public.repository_collaborators(repository_id);

create index if not exists repository_collaborators_user_id_idx
  on public.repository_collaborators(user_id);

create index if not exists repository_collaborators_invited_by_idx
  on public.repository_collaborators(invited_by);

drop trigger if exists repository_collaborators_set_updated_at
  on public.repository_collaborators;

create trigger repository_collaborators_set_updated_at
before update on public.repository_collaborators
for each row execute function public.set_updated_at();


-- ---------------------------------------------------------
-- 3. ISSUES
-- ---------------------------------------------------------

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null
    references public.repositories(id) on delete cascade,
  author_id uuid not null
    references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  status text not null default 'open',
  priority text not null default 'normal',
  labels text[] not null default '{}',
  assignee_id uuid
    references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,

  constraint issues_status_check
    check (status in ('open', 'closed')),

  constraint issues_priority_check
    check (priority in ('low', 'normal', 'high', 'urgent')),

  constraint issues_title_length_check
    check (char_length(title) between 1 and 200),

  constraint issues_body_length_check
    check (body is null or char_length(body) <= 20000)
);

create index if not exists issues_repository_id_idx
  on public.issues(repository_id);

create index if not exists issues_author_id_idx
  on public.issues(author_id);

create index if not exists issues_assignee_id_idx
  on public.issues(assignee_id);

create index if not exists issues_repo_status_idx
  on public.issues(repository_id, status);

drop trigger if exists issues_set_updated_at on public.issues;

create trigger issues_set_updated_at
before update on public.issues
for each row execute function public.set_updated_at();


-- ---------------------------------------------------------
-- 4. ISSUE COMMENTS
-- ---------------------------------------------------------

create table if not exists public.issue_comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null
    references public.issues(id) on delete cascade,
  author_id uuid not null
    references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint issue_comments_body_length_check
    check (char_length(body) between 1 and 10000)
);

create index if not exists issue_comments_issue_id_idx
  on public.issue_comments(issue_id);

create index if not exists issue_comments_author_id_idx
  on public.issue_comments(author_id);

drop trigger if exists issue_comments_set_updated_at
  on public.issue_comments;

create trigger issue_comments_set_updated_at
before update on public.issue_comments
for each row execute function public.set_updated_at();


-- ---------------------------------------------------------
-- 5. NOTIFICATIONS
-- ---------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null
    references public.profiles(id) on delete cascade,
  actor_id uuid
    references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now(),

  constraint notifications_type_check
    check (
      type in (
        'follow',
        'star',
        'repository_invitation',
        'issue_assigned',
        'issue_comment',
        'mention',
        'system'
      )
    ),

  constraint notifications_title_length_check
    check (char_length(title) between 1 and 200),

  constraint notifications_body_length_check
    check (body is null or char_length(body) <= 500),

  constraint notifications_no_self_reference
    check (actor_id is null or actor_id <> recipient_id)
);

create index if not exists notifications_recipient_id_idx
  on public.notifications(recipient_id);

create index if not exists notifications_actor_id_idx
  on public.notifications(actor_id);

create index if not exists notifications_recipient_unread_idx
  on public.notifications(recipient_id)
  where read_at is null;


-- ---------------------------------------------------------
-- 6. INTEGRITY TRIGGERS
-- ---------------------------------------------------------

-- Repository ownership can only be changed by the current owner.
create or replace function public.guard_repository_owner_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id <> old.owner_id
     and (select auth.uid()) is distinct from old.owner_id then
    raise exception
      'Only the repository owner can change repository ownership.';
  end if;
  return new;
end;
$$;

drop trigger if exists repositories_owner_immutable
  on public.repositories;

create trigger repositories_owner_immutable
before update on public.repositories
for each row execute function public.guard_repository_owner_change();


-- Keep closed_at consistent with status on every update,
-- regardless of which client performed it.
create or replace function public.handle_issue_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'closed' and old.status <> 'closed' then
    new.closed_at := now();
  elsif new.status = 'open' and old.status <> 'open' then
    new.closed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists issues_status_closed_at on public.issues;

create trigger issues_status_closed_at
before update on public.issues
for each row execute function public.handle_issue_status_change();


-- The invited developer may only change the status of their own
-- pending invitation (to accepted or declined). Role changes,
-- re-invitations and removals require an owner or admin, which
-- the RLS update policy restricts.
create or replace function public.guard_collaborator_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_repo_owner uuid;
begin
  select owner_id into v_repo_owner
  from public.repositories
  where id = new.repository_id;

  if (select auth.uid()) = new.user_id
     and (select auth.uid()) is distinct from v_repo_owner then

    if new.repository_id <> old.repository_id
       or new.user_id <> old.user_id
       or new.role <> old.role
       or new.status not in ('accepted', 'declined')
       or old.status <> 'pending'
    then
      raise exception
        'You can only accept or decline this invitation.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists repository_collaborators_guard_update
  on public.repository_collaborators;

create trigger repository_collaborators_guard_update
before update on public.repository_collaborators
for each row execute function public.guard_collaborator_update();


-- ---------------------------------------------------------
-- 7. SECURITY-DEFINER ACCESS HELPERS
--
-- Policies on repositories and repository_collaborators
-- reference each other; evaluating those subqueries under RLS
-- would recurse infinitely. These helpers read the tables
-- directly (definer privileges, empty search_path) so policy
-- evaluation terminates. They only ever answer questions about
-- the CURRENT caller, so exposing them to clients is safe.
-- ---------------------------------------------------------

-- Safely cast a text storage segment to uuid (null when invalid).
create or replace function public.try_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return p_value::uuid;
exception when others then
  return null;
end;
$$;


-- Owner or accepted collaborator (any role).
create or replace function public.is_repo_member(p_repository uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.repositories r
    where r.id = p_repository
      and (
        r.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.repository_collaborators c
          where c.repository_id = p_repository
            and c.user_id = (select auth.uid())
            and c.status = 'accepted'
        )
      )
  );
$$;


-- Public repository, owner or accepted collaborator.
create or replace function public.can_view_repo(p_repository uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.repositories r
    where r.id = p_repository
      and (
        r.visibility = 'public'
        or r.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.repository_collaborators c
          where c.repository_id = p_repository
            and c.user_id = (select auth.uid())
            and c.status = 'accepted'
        )
      )
  );
$$;


-- Owner or accepted collaborator with role write or admin.
create or replace function public.is_repo_writer(p_repository uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.repositories r
    where r.id = p_repository
      and (
        r.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.repository_collaborators c
          where c.repository_id = p_repository
            and c.user_id = (select auth.uid())
            and c.status = 'accepted'
            and c.role in ('write', 'admin')
        )
      )
  );
$$;


-- Owner or accepted admin collaborator.
create or replace function public.is_repo_admin(p_repository uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.repositories r
    where r.id = p_repository
      and (
        r.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.repository_collaborators c
          where c.repository_id = p_repository
            and c.user_id = (select auth.uid())
            and c.status = 'accepted'
            and c.role = 'admin'
        )
      )
  );
$$;


-- Repository that owns the given issue is viewable by the caller.
create or replace function public.can_view_issue(p_issue uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.issues i
    join public.repositories r on r.id = i.repository_id
    where i.id = p_issue
      and (
        r.visibility = 'public'
        or r.owner_id = (select auth.uid())
        or exists (
          select 1
          from public.repository_collaborators c
          where c.repository_id = r.id
            and c.user_id = (select auth.uid())
            and c.status = 'accepted'
        )
      )
  );
$$;


-- Minimal repository information for one of the caller's own
-- invitations. Pending invitations do NOT grant repository
-- access; this function only exposes the repository name,
-- owner username and visibility so the invitee can decide.
create or replace function public.invitation_repo_info(
  p_invitation uuid
)
returns table (
  repository_id uuid,
  repository_name text,
  owner_username text,
  visibility text
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.repository_id, r.name, p.username, r.visibility
  from public.repository_collaborators c
  join public.repositories r on r.id = c.repository_id
  join public.profiles p on p.id = r.owner_id
  where c.id = p_invitation
    and c.user_id = (select auth.uid());
$$;


-- ---------------------------------------------------------
-- 8. NOTIFICATION GENERATION (trusted path only)
--
-- The public client has NO insert permission on
-- public.notifications. Rows are only created by these
-- security-definer triggers and by server-side operators.
-- ---------------------------------------------------------

create or replace function public.create_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_recipient_id is null then
    return;
  end if;

  -- Never notify someone about their own action.
  if p_actor_id is not null and p_actor_id = p_recipient_id then
    return;
  end if;

  -- Prevent duplicate or excessive notifications:
  -- one-shot events (follow/star) never repeat the same
  -- actor+link; conversation events only re-notify after the
  -- previous notification has been read.
  if exists (
    select 1
    from public.notifications n
    where n.recipient_id = p_recipient_id
      and n.actor_id is not distinct from p_actor_id
      and n.type = p_type
      and coalesce(n.link, '') = coalesce(p_link, '')
      and (
        p_type in ('follow', 'star')
        or n.read_at is null
      )
  ) then
    return;
  end if;

  insert into public.notifications
    (recipient_id, actor_id, type, title, body, link)
  values
    (p_recipient_id, p_actor_id, p_type, p_title, p_body, p_link);
end;
$$;


create or replace function public.handle_new_follower()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_username text;
begin
  select username into v_actor_username
  from public.profiles
  where id = new.follower_id;

  perform public.create_notification(
    new.following_id,
    new.follower_id,
    'follow',
    'New follower',
    coalesce(v_actor_username, 'A developer') ||
      ' started following you.',
    '/' || coalesce(v_actor_username, '')
  );

  return new;
end;
$$;

drop trigger if exists followers_notify_follow
  on public.followers;

create trigger followers_notify_follow
after insert on public.followers
for each row execute function public.handle_new_follower();


create or replace function public.handle_new_star()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_owner_username text;
  v_repo_name text;
begin
  select r.owner_id, r.name into v_owner_id, v_repo_name
  from public.repositories r
  where r.id = new.repository_id;

  if v_owner_id is null then
    return new;
  end if;

  select username into v_owner_username
  from public.profiles
  where id = v_owner_id;

  perform public.create_notification(
    v_owner_id,
    new.user_id,
    'star',
    'Repository starred',
    'A developer starred ' || coalesce(v_repo_name, 'your repository') || '.',
    '/' || coalesce(v_owner_username, '') || '/' ||
      coalesce(v_repo_name, '')
  );

  return new;
end;
$$;

drop trigger if exists stars_notify_star
  on public.stars;

create trigger stars_notify_star
after insert on public.stars
for each row execute function public.handle_new_star();


create or replace function public.handle_collaborator_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inviter_username text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  select username into v_inviter_username
  from public.profiles
  where id = new.invited_by;

  perform public.create_notification(
    new.user_id,
    new.invited_by,
    'repository_invitation',
    'Repository invitation',
    coalesce(v_inviter_username, 'A developer') ||
      ' invited you to collaborate on a repository.',
    '/dashboard/invitations'
  );

  return new;
end;
$$;

drop trigger if exists repository_collaborators_notify_invitation
  on public.repository_collaborators;

create trigger repository_collaborators_notify_invitation
after insert on public.repository_collaborators
for each row
execute function public.handle_collaborator_invitation();


create or replace function public.handle_issue_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_repo_owner_username text;
  v_repo_name text;
begin
  if new.assignee_id is null
     or new.assignee_id is not distinct from old.assignee_id then
    return new;
  end if;

  select p.username, r.name into v_repo_owner_username, v_repo_name
  from public.repositories r
  join public.profiles p on p.id = r.owner_id
  where r.id = new.repository_id;

  perform public.create_notification(
    new.assignee_id,
    (select auth.uid()),
    'issue_assigned',
    'Issue assigned to you',
    'You were assigned to an issue in ' ||
      coalesce(v_repo_name, 'a repository') || '.',
    '/' || coalesce(v_repo_owner_username, '') || '/' ||
      coalesce(v_repo_name, '') || '/issues/' || new.id::text
  );

  return new;
end;
$$;

drop trigger if exists issues_notify_assignment
  on public.issues;

create trigger issues_notify_assignment
after update on public.issues
for each row execute function public.handle_issue_assignment();


create or replace function public.handle_new_issue_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_issue_author uuid;
  v_repo_owner_username text;
  v_repo_name text;
begin
  select i.author_id into v_issue_author
  from public.issues i
  where i.id = new.issue_id;

  if v_issue_author is null
     or v_issue_author = new.author_id then
    return new;
  end if;

  select p.username, r.name into v_repo_owner_username, v_repo_name
  from public.issues i
  join public.repositories r on r.id = i.repository_id
  join public.profiles p on p.id = r.owner_id
  where i.id = new.issue_id;

  perform public.create_notification(
    v_issue_author,
    new.author_id,
    'issue_comment',
    'New comment on your issue',
    'A developer commented on an issue in ' ||
      coalesce(v_repo_name, 'a repository') || '.',
    '/' || coalesce(v_repo_owner_username, '') || '/' ||
      coalesce(v_repo_name, '') || '/issues/' || new.issue_id::text
  );

  return new;
end;
$$;

drop trigger if exists issue_comments_notify_comment
  on public.issue_comments;

create trigger issue_comments_notify_comment
after insert on public.issue_comments
for each row execute function public.handle_new_issue_comment();


-- ---------------------------------------------------------
-- 9. RLS — NEW TABLES
-- ---------------------------------------------------------

alter table public.repository_collaborators enable row level security;
alter table public.issues enable row level security;
alter table public.issue_comments enable row level security;
alter table public.notifications enable row level security;


-- repository_collaborators --------------------------------

drop policy if exists "Collaborator rows are viewable by members and invitees"
  on public.repository_collaborators;

create policy "Collaborator rows are viewable by members and invitees"
on public.repository_collaborators
for select
to anon, authenticated
using (
  user_id = (select auth.uid())
  or public.can_view_repo(repository_id)
);


drop policy if exists "Repository admins can invite collaborators"
  on public.repository_collaborators;

create policy "Repository admins can invite collaborators"
on public.repository_collaborators
for insert
to authenticated
with check (
  invited_by = (select auth.uid())
  and status = 'pending'
  and user_id <> (select auth.uid())
  and public.is_repo_admin(repository_id)
  and not exists (
    select 1
    from public.repositories r
    where r.id = repository_id
      and r.owner_id = repository_collaborators.user_id
  )
);


drop policy if exists "Invitees respond, admins manage membership"
  on public.repository_collaborators;

create policy "Invitees respond, admins manage membership"
on public.repository_collaborators
for update
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_repo_admin(repository_id)
)
with check (
  user_id = (select auth.uid())
  or public.is_repo_admin(repository_id)
);


drop policy if exists "Admins remove collaborators, invitees dismiss declined invitations"
  on public.repository_collaborators;

create policy "Admins remove collaborators, invitees dismiss declined invitations"
on public.repository_collaborators
for delete
to authenticated
using (
  public.is_repo_admin(repository_id)
  or (
    user_id = (select auth.uid())
    and status = 'declined'
  )
);


-- issues --------------------------------------------------

drop policy if exists "Issues follow repository visibility"
  on public.issues;

create policy "Issues follow repository visibility"
on public.issues
for select
to anon, authenticated
using (
  author_id = (select auth.uid())
  or public.can_view_repo(repository_id)
);


drop policy if exists "Authenticated users can open issues on visible repositories"
  on public.issues;

create policy "Authenticated users can open issues on visible repositories"
on public.issues
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and public.can_view_repo(repository_id)
);


drop policy if exists "Authors and repository admins can update issues"
  on public.issues;

create policy "Authors and repository admins can update issues"
on public.issues
for update
to authenticated
using (
  author_id = (select auth.uid())
  or public.is_repo_admin(repository_id)
)
with check (
  author_id = (select auth.uid())
  or public.is_repo_admin(repository_id)
);


drop policy if exists "Authors and repository admins can delete issues"
  on public.issues;

create policy "Authors and repository admins can delete issues"
on public.issues
for delete
to authenticated
using (
  author_id = (select auth.uid())
  or public.is_repo_admin(repository_id)
);


-- issue_comments ------------------------------------------

drop policy if exists "Comments follow issue visibility"
  on public.issue_comments;

create policy "Comments follow issue visibility"
on public.issue_comments
for select
to anon, authenticated
using (
  public.can_view_issue(issue_id)
);


drop policy if exists "Authenticated users can comment on visible issues"
  on public.issue_comments;

create policy "Authenticated users can comment on visible issues"
on public.issue_comments
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and public.can_view_issue(issue_id)
);


drop policy if exists "Users can edit their own comments"
  on public.issue_comments;

create policy "Users can edit their own comments"
on public.issue_comments
for update
to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));


drop policy if exists "Authors and repository admins can delete comments"
  on public.issue_comments;

create policy "Authors and repository admins can delete comments"
on public.issue_comments
for delete
to authenticated
using (
  author_id = (select auth.uid())
  or public.is_repo_admin(
    (
      select i.repository_id
      from public.issues i
      where i.id = issue_comments.issue_id
    )
  )
);


-- notifications -------------------------------------------
-- Recipients can read, mark-as-read and delete their own
-- notifications. There is deliberately NO insert policy:
-- clients can never create notifications for anyone. Trusted
-- security-definer triggers are the only writers.

drop policy if exists "Users can read their own notifications"
  on public.notifications;

create policy "Users can read their own notifications"
on public.notifications
for select
to authenticated
using (recipient_id = (select auth.uid()));


drop policy if exists "Users can update their own notifications"
  on public.notifications;

create policy "Users can update their own notifications"
on public.notifications
for update
to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));


drop policy if exists "Users can delete their own notifications"
  on public.notifications;

create policy "Users can delete their own notifications"
on public.notifications
for delete
to authenticated
using (recipient_id = (select auth.uid()));


-- ---------------------------------------------------------
-- 10. UPDATED POLICIES — repositories, repository_files,
--     and the "repo-files" storage bucket now honour
--     accepted collaborator membership and roles.
-- ---------------------------------------------------------

-- Drop the policies this migration replaces.
drop policy if exists
  "Public repositories and owners are readable"
  on public.repositories;

drop policy if exists
  "Owners can update their repositories"
  on public.repositories;

drop policy if exists
  "Repository files follow repository visibility"
  on public.repository_files;

drop policy if exists
  "Owners can add repository file metadata"
  on public.repository_files;

drop policy if exists
  "Owners can delete repository file metadata"
  on public.repository_files;

drop policy if exists
  "Owners can upload repository files"
  on storage.objects;

drop policy if exists
  "Users can read permitted repository files"
  on storage.objects;

drop policy if exists
  "Owners can delete repository files"
  on storage.objects;


-- repositories ---------------------------------------------

create policy "Public repositories, owners and collaborators are readable"
on public.repositories
for select
to anon, authenticated
using (
  visibility = 'public'
  or public.is_repo_member(id)
);


create policy "Owners and admin collaborators can update repositories"
on public.repositories
for update
to authenticated
using (public.is_repo_admin(id))
with check (public.is_repo_admin(id));


-- repository_files -------------------------------------------
-- File paths look like: <uploader-id>/<repository-id>/...
-- Pending invitations deliberately grant nothing here.

create policy "Repository files follow repository visibility"
on public.repository_files
for select
to anon, authenticated
using (public.can_view_repo(repository_id));


create policy "Repository writers can add file metadata"
on public.repository_files
for insert
to authenticated
with check (
  public.is_repo_writer(repository_id)
  and (storage.foldername(repository_files.storage_path))[1]
      = (select auth.uid())::text
  and (storage.foldername(repository_files.storage_path))[2]
      = repository_id::text
);


create policy "Repository writers can delete file metadata"
on public.repository_files
for delete
to authenticated
using (public.is_repo_writer(repository_id));


-- storage: repo-files ----------------------------------------
-- The bucket is private. Read access mirrors repository
-- visibility (public, owner or accepted collaborator); write
-- access requires the write or admin role (or ownership).

create policy "Users can read permitted repository files"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'repo-files'
  and public.can_view_repo(
    public.try_uuid((storage.foldername(name))[2])
  )
);


create policy "Repository writers can upload files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'repo-files'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.is_repo_writer(
    public.try_uuid((storage.foldername(name))[2])
  )
);


create policy "Repository writers can delete files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'repo-files'
  and public.is_repo_writer(
    public.try_uuid((storage.foldername(name))[2])
  )
);


-- ---------------------------------------------------------
-- 11. GRANTS
-- ---------------------------------------------------------

grant select on public.repository_collaborators
  to anon, authenticated;
grant insert, update, delete on public.repository_collaborators
  to authenticated;

grant select on public.issues to anon, authenticated;
grant insert, update, delete on public.issues to authenticated;

grant select on public.issue_comments to anon, authenticated;
grant insert, update, delete on public.issue_comments
  to authenticated;

grant select, update, delete on public.notifications
  to authenticated;

-- Access helpers used inside RLS policies must stay executable
-- by regular clients. They only answer questions about the
-- current caller.
grant execute on function public.try_uuid(text)
  to anon, authenticated;
grant execute on function public.is_repo_member(uuid)
  to anon, authenticated;
grant execute on function public.can_view_repo(uuid)
  to anon, authenticated;
grant execute on function public.is_repo_writer(uuid)
  to anon, authenticated;
grant execute on function public.is_repo_admin(uuid)
  to anon, authenticated;
grant execute on function public.can_view_issue(uuid)
  to anon, authenticated;
grant execute on function public.invitation_repo_info(uuid)
  to authenticated;

-- Trusted notification machinery is never callable by clients.
revoke execute on function public.create_notification(
  uuid, uuid, text, text, text, text
) from public, anon, authenticated;
revoke execute on function public.handle_new_follower()
  from public, anon, authenticated;
revoke execute on function public.handle_new_star()
  from public, anon, authenticated;
revoke execute on function public.handle_collaborator_invitation()
  from public, anon, authenticated;
revoke execute on function public.handle_issue_assignment()
  from public, anon, authenticated;
revoke execute on function public.handle_new_issue_comment()
  from public, anon, authenticated;
revoke execute on function public.guard_repository_owner_change()
  from public, anon, authenticated;
revoke execute on function public.handle_issue_status_change()
  from public, anon, authenticated;
revoke execute on function public.guard_collaborator_update()
  from public, anon, authenticated;

commit;

-- =========================================================
-- VECTORVAULT COLLABORATION FOUNDATION COMPLETE
-- =========================================================

-- =========================================================
-- 19. POLICY CLEANUP & FK INDEXES (migration 20261111112009)
-- =========================================================

-- =========================================================
-- VECTORVAULT — 20261111112009_vectorvault_policy_cleanup_and_fk_indexes
--
-- Applied to the live Supabase project as migration
-- "20261111112009 — vectorvault_policy_cleanup_and_fk_indexes".
--
-- Purpose:
--   1. Final sweep: drop any superseded policies that may
--      remain from the pre-collaboration schema.
--   2. Add foreign-key indexes that the original schema and the
--      collaboration foundation did not create.
--
-- DO NOT re-apply blindly: the live project already contains
-- these changes.
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. POLICY CLEANUP SWEEP
--
-- The collaboration foundation replaced these policies with
-- collaborator-aware versions. They are dropped again here so
-- that any environment where they linger is cleaned up.
-- All drops are idempotent.
-- ---------------------------------------------------------

drop policy if exists
  "Public repositories and owners are readable"
  on public.repositories;

drop policy if exists
  "Owners can update their repositories"
  on public.repositories;

drop policy if exists
  "Repository files follow repository visibility"
  on public.repository_files;

drop policy if exists
  "Owners can add repository file metadata"
  on public.repository_files;

drop policy if exists
  "Owners can delete repository file metadata"
  on public.repository_files;

drop policy if exists
  "Owners can upload repository files"
  on storage.objects;

drop policy if exists
  "Users can read permitted repository files"
  on storage.objects;

drop policy if exists
  "Owners can delete repository files"
  on storage.objects;

-- ---------------------------------------------------------
-- 2. FOREIGN-KEY INDEXES
-- ---------------------------------------------------------

-- repositories
create index if not exists repositories_owner_id_idx
  on public.repositories(owner_id);

-- repository_files
create index if not exists repository_files_repository_id_idx
  on public.repository_files(repository_id);

-- stars (user_id had no index; repository_id already did)
create index if not exists stars_user_id_idx
  on public.stars(user_id);

-- followers
create index if not exists followers_following_id_idx
  on public.followers(following_id);
create index if not exists followers_follower_id_idx
  on public.followers(follower_id);

-- repository_collaborators
create index if not exists repository_collaborators_repository_id_idx
  on public.repository_collaborators(repository_id);
create index if not exists repository_collaborators_user_id_idx
  on public.repository_collaborators(user_id);
create index if not exists repository_collaborators_invited_by_idx
  on public.repository_collaborators(invited_by);

-- issues
create index if not exists issues_repository_id_idx
  on public.issues(repository_id);
create index if not exists issues_author_id_idx
  on public.issues(author_id);
create index if not exists issues_assignee_id_idx
  on public.issues(assignee_id);

-- issue_comments
create index if not exists issue_comments_issue_id_idx
  on public.issue_comments(issue_id);
create index if not exists issue_comments_author_id_idx
  on public.issue_comments(author_id);

-- notifications
create index if not exists notifications_recipient_id_idx
  on public.notifications(recipient_id);
create index if not exists notifications_actor_id_idx
  on public.notifications(actor_id);
create index if not exists notifications_recipient_unread_idx
  on public.notifications(recipient_id)
  where read_at is null;

commit;

-- =========================================================
-- VECTORVAULT POLICY CLEANUP AND FK INDEXES COMPLETE
-- =========================================================

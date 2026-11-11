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

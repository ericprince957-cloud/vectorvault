# VectorVault — Database Design

## Overview

VectorVault uses Supabase PostgreSQL to manage application data.

The database supports user accounts, developer profiles, repositories,
repository collaboration, issue tracking and notifications.

There are nine public tables. Row Level Security (RLS) is enabled on
every table and is the real enforcement layer for access control.

## 1. Profiles Table

Stores public developer information.

| Column | Type | Description |
|---|---|---|
| id | UUID | References authenticated user |
| username | TEXT | Unique username |
| full_name | TEXT | Developer's name |
| bio | TEXT | Short biography |
| avatar_url | TEXT | Profile picture |
| website | TEXT | Personal website |
| location | TEXT | Developer location |
| skills | TEXT[] | Developer skills |
| github_url | TEXT | GitHub profile link |
| created_at | TIMESTAMPTZ | Account creation date |

## 2. Repositories Table

Stores repository information.

| Column | Type | Description |
|---|---|---|
| id | UUID | Repository ID |
| owner_id | UUID | Repository owner |
| name | TEXT | Repository name |
| description | TEXT | Repository description |
| visibility | TEXT | Public or private |
| topics | TEXT[] | Repository topics (max 8, normalized) |
| created_at | TIMESTAMPTZ | Creation date |
| updated_at | TIMESTAMPTZ | Last update |

Topics are stored as a `text[]` array with a default of `{}`.
Duplicate and oversized topic values are removed by the application
before saving.

## 3. Repository Files

Stores metadata about uploaded files and folders.

| Column | Type | Description |
|---|---|---|
| id | UUID | File ID |
| repository_id | UUID | Associated repository |
| file_name | TEXT | File name |
| file_path | TEXT | Path within the repository (nested folders) |
| storage_path | TEXT | Supabase Storage location |
| file_size | BIGINT | File size |
| created_at | TIMESTAMPTZ | Upload date |

## 4. Stars Table

Tracks repositories bookmarked by developers. A unique constraint on
`(user_id, repository_id)` prevents duplicate stars.

| Column | Type | Description |
|---|---|---|
| id | UUID | Record ID |
| user_id | UUID | Developer |
| repository_id | UUID | Starred repository |
| created_at | TIMESTAMPTZ | Date starred |

## 5. Followers Table

Tracks relationships between developers. A unique constraint on
`(follower_id, following_id)` prevents duplicate relationships and a
check constraint prevents self-follows.

| Column | Type | Description |
|---|---|---|
| id | UUID | Record ID |
| follower_id | UUID | Developer following |
| following_id | UUID | Developer being followed |
| created_at | TIMESTAMPTZ | Follow date |

## 6. Repository Collaborators Table

Repository membership and collaboration invitations.

| Column | Type | Description |
|---|---|---|
| id | UUID | Record ID |
| repository_id | UUID | Associated repository |
| user_id | UUID | Invited collaborator |
| role | TEXT | read, write or admin |
| invited_by | UUID | Who sent the invitation |
| status | TEXT | pending, accepted or declined |
| created_at | TIMESTAMPTZ | Invitation date |
| updated_at | TIMESTAMPTZ | Last change |

Role permissions:

- **read** — view repository content, browse and download files.
- **write** — read plus upload files, create folders, edit content.
- **admin** — write plus manage collaborators and repository settings.

The repository owner always retains full control. Pending invitations
do **not** grant access to private repositories.

## 7. Issues Table

Repository issue tracking.

| Column | Type | Description |
|---|---|---|
| id | UUID | Issue ID |
| repository_id | UUID | Associated repository |
| author_id | UUID | Issue author |
| title | TEXT | Issue title |
| body | TEXT | Issue description |
| status | TEXT | open or closed |
| priority | TEXT | low, normal, high or urgent |
| labels | TEXT[] | Issue labels |
| assignee_id | UUID | Assigned developer |
| created_at | TIMESTAMPTZ | Creation date |
| updated_at | TIMESTAMPTZ | Last update |
| closed_at | TIMESTAMPTZ | Closed date (cleared on reopen) |

A database trigger keeps `closed_at` in sync with `status`.

## 8. Issue Comments Table

Discussion under repository issues.

| Column | Type | Description |
|---|---|---|
| id | UUID | Comment ID |
| issue_id | UUID | Associated issue |
| author_id | UUID | Comment author |
| body | TEXT | Comment text |
| created_at | TIMESTAMPTZ | Creation date |
| updated_at | TIMESTAMPTZ | Last edit |

## 9. Notifications Table

In-app notifications.

| Column | Type | Description |
|---|---|---|
| id | UUID | Notification ID |
| recipient_id | UUID | Receiving user |
| actor_id | UUID | User who triggered the event |
| type | TEXT | follow, star, repository_invitation, issue_assigned, issue_comment, mention or system |
| title | TEXT | Notification title |
| body | TEXT | Short message |
| link | TEXT | Link to the related resource |
| read_at | TIMESTAMPTZ | Read timestamp (null = unread) |
| created_at | TIMESTAMPTZ | Received date |

Notifications are created exclusively by security-definer database
triggers. There is deliberately no client insert policy, so users can
never craft notifications for other users.

## Database Relationships

- Each user has one developer profile.
- Each user can own multiple repositories.
- Each repository can contain multiple files and folders.
- Each repository can have collaborators, issues and topics.
- Each issue can have comments and an assignee.
- Users can star multiple repositories and follow multiple developers.
- User activity generates notifications.

## Security Strategy

Supabase Row Level Security (RLS) is enabled on every table.

- Users can edit their own profiles.
- Users can manage their own repositories.
- Public repositories can be viewed by everyone.
- Private repositories are accessible only to the owner and accepted
  collaborators with sufficient role.
- Storage access (`repo-files` bucket) follows the same rules as the
  database via storage policies.
- Notifications are only readable and manageable by their recipient.

## Migrations

Database migrations are version-controlled under
`vectorvault/supabase/migrations/`:

- `20261111111944_vectorvault_collaboration_foundation.sql` — adds the
  `topics` column, the four collaboration tables, integrity triggers,
  security-definer helper functions, notification triggers and the
  RLS/storage policies.
- `20261111112009_vectorvault_policy_cleanup_and_fk_indexes.sql` —
  drops superseded legacy policies and adds foreign-key indexes.

Both migrations were applied to the live Supabase project and are
recorded in the `supabase_migrations.schema_migrations` table.

## Important Notes

Column definitions above reflect the live database, which has evolved
beyond the original `schema.sql` baseline. Inspect the live schema
before writing new queries.

Built by Vector Codes.

Founder: Prince Eric.

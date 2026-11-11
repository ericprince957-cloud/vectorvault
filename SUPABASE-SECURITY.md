# VectorVault — Security Strategy

## Authentication

Supabase Auth manages user authentication.

Authentication methods:

- Email and password.
- Email verification.
- Password recovery.

Google authentication may be introduced later.

### Outstanding dashboard configuration task

**Leaked-password protection is currently disabled in the Supabase
Auth settings.** It should be enabled from
*Authentication → Providers → Email* in the Supabase dashboard so that
sign-ups using credentials from known data breaches are rejected.
This is a dashboard configuration change, not a code change.

## Database Security

All tables use Row Level Security (RLS). RLS is the real enforcement
layer — the interface only decides what to render.

### Profiles

- Public profile information can be viewed by everyone.
- Users can update their own profiles.
- Users cannot modify another user's profile.

### Repositories

- Owners can create, update and delete their repositories.
- The repository owner cannot be changed through the client (enforced
  by a trigger).
- Public repositories can be viewed by everyone.
- Private repositories are visible only to the owner and accepted
  collaborators.
- Topics, files and issues all follow repository visibility.

### Collaborators and role permissions

Access levels are enforced in RLS via security-definer helper
functions (`is_repo_member`, `can_view_repo`, `is_repo_writer`,
`is_repo_admin`) to avoid recursive policy evaluation:

- **read** — view repository content, browse and download files.
- **write** — read plus upload files, create folders, edit content.
- **admin** — write plus manage collaborators and repository settings.
- The owner always retains full control.

Pending or declined invitations grant **no** repository access.
Collaborators can only change their own invitation status (accepted or
declined); only owners and admins change roles or remove members.

### Issues and comments

- Issue visibility follows repository visibility.
- The issue author and repository admins can update or delete an issue.
- Any authenticated user who can see an issue can comment on it.
- Users can only edit their own comments.
- Comments can be deleted by their author or a repository admin.

### Notifications

- Users can only read, mark-as-read and delete their own notifications.
- There is **no client insert policy**. Notifications are created only
  by trusted security-definer triggers, so users can never craft
  notifications for other users.
- Duplicate notifications are suppressed by the trigger functions.

## File Storage

- The `repo-files` storage bucket keeps files private; access is
  granted only through signed URLs.
- Storage policies mirror the database rules: public repository files
  are readable by everyone; private repository files are readable only
  by the owner and accepted collaborators; uploads require the write
  role; deletion requires the admin role or file ownership.
- Storage object paths embed the uploader and repository IDs, which
  the policies validate.
- Private files are never exposed through public URLs.

## Application Security

- Never expose Supabase service-role keys.
- Keep secrets in environment variables.
- Validate user input.
- Perform authorization checks on the server.
- Use secure authentication sessions.

## Important Security Principle

Hiding a private repository in the interface is not sufficient.

All access is enforced through database policies, storage policies and
server-side authorization.

## Future Improvements

- Rate limiting.
- Abuse prevention.
- Audit logging.
- Security testing.
- Account recovery improvements.
- Mention support with notifications.

---

Built by Vector Codes.

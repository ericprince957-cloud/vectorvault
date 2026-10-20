# VectorVault — Security Strategy

## Authentication

Supabase Auth will manage user authentication.

Initial authentication methods:

- Email and password.
- Email verification.
- Password recovery.

Google authentication may be introduced later.

## Database Security

All user-related tables must use Row Level Security (RLS).

## Profiles

- Public profile information can be viewed by everyone.
- Users can update their own profiles.
- Users cannot modify another user's profile.

## Repositories

- Repository owners can create repositories.
- Owners can update and delete their repositories.
- Public repositories can be viewed by everyone.
- Private repositories are accessible only to authorized users.

## File Storage

- Uploaded files must respect repository permissions.
- Private files must never have unrestricted public access.
- File uploads should have size and type restrictions.
- Storage paths must be validated.

## Application Security

- Never expose Supabase service-role keys.
- Keep secrets in environment variables.
- Validate user input.
- Perform authorization checks on the server.
- Use secure authentication sessions.

## Important Security Principle

Hiding a private repository in the interface is not sufficient.

All access must be enforced through database policies, storage policies and server-side authorization.

## Future Improvements

- Rate limiting.
- Abuse prevention.
- Audit logging.
- Security testing.
- Account recovery improvements.

---

Built by Vector Codes.
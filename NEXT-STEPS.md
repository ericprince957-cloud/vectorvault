# VectorVault — Next Steps & Setup Guide

This document explains what has been built, what you must do to connect it to
Supabase, and what remains on the roadmap.

---

## 1. What was built (current state)

### Layout & landing
- Root layout finalized (your code) with VectorVault metadata and dark theme.
- Landing page updated with an **Explore** nav link, **Explore projects** CTA
  and a footer (About, Features, Explore, Docs, GitHub, Contact, copyright).

### Authentication (Supabase Auth)
- `/signup` — registration with username, full name, email and password
  (username is stored in user metadata; a database trigger creates the profile).
- `/login` — email + password login.
- `/auth/callback` — route that exchanges the auth code for a session
  (used by email verification links).
- `src/middleware.ts` — refreshes sessions and blocks unauthenticated
  access to `/dashboard/*`.
- `src/components/SignOutButton.tsx` — sign out from the sidebar.

### Dashboard (`/dashboard`)
- Layout with sidebar: Dashboard, My Repositories, My Profile, Settings, Sign out.
- Overview page: welcome message, total/public/private repo counts, quick
  actions, recently updated repositories, and an empty state for new users.
- My Repositories page with empty state.
- Create Repository page (name, description, public/private).
- Profile page (settings): edit full name, bio, location, website, GitHub link,
  skills. Username is permanent.

### Public pages
- `/[username]` — public developer profile: avatar, name, bio, location,
  website, GitHub, skills, join date, and public repositories only.
- `/explore` — browse/search public repositories and developer profiles
  without an account.

### Database (`vectorvault/supabase/schema.sql`)
- Tables: `profiles`, `repositories`, `repository_files`, `stars`, `followers`.
- Row Level Security policies for every table (public read for public data,
  owner-only writes, private repo protection).
- Trigger `handle_new_user` that auto-creates a profile on signup.
- Storage buckets: `repo-files` (private) and `avatars` (public), with policies.

---

## 2. How to connect Supabase (do this first)

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is fine).
2. **Run the schema**: in the Supabase dashboard open *SQL Editor → New query*,
   paste the entire contents of `vectorvault/supabase/schema.sql` and run it.
   This creates the tables, RLS policies, trigger and storage buckets.
3. **Get your keys**: *Settings → API*.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Create the env file**: copy `vectorvault/.env.example` to
   `vectorvault/.env.local` and fill in your values. Never commit
   `.env.local` and never expose the `service_role` key.
5. **Configure auth redirect**: in Supabase *Authentication → URL Configuration*,
   set **Site URL** to `http://localhost:3000` for development and your Vercel
   domain for production, and add `http://localhost:3000/auth/callback` to the
   redirect allow-list.
6. **Enable email confirmations** (optional): *Authentication → Providers → Email*.
   If you leave it off, users are signed in immediately after signup.
7. **Install & run**:
   ```bash
   cd vectorvault
   npm install
   npm run dev
   ```
   Then test the full flow: sign up → verify email (if enabled) → dashboard →
   create a repository → edit profile → visit `/your-username` → `/explore`.

---

## 3. Deploy to Vercel

1. Push this repo to GitHub (done) and import it in Vercel.
   Set the **root directory** to `vectorvault`.
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   as environment variables in Vercel.
3. Update Supabase *Authentication → URL Configuration* with your production
   domain and `https://your-domain/auth/callback`.
4. Deploy. Every push to `main` will now auto-deploy.

---

## 4. What still needs to be built

### Phase 3 — Repository management (next priority)
- **Repository detail page** (`/username/repo-name`) with tabs for files,
  description and settings.
- **File upload UI**: drag-and-drop upload to the `repo-files` bucket,
  inserting rows into `repository_files` (schema + storage policies already exist).
- **Source code viewer**: fetch file content and display with syntax
  highlighting (e.g. `shiki` or `prismjs`).
- **Download**: single-file download and “download repository as ZIP”
  (iterate `repository_files` and stream from storage; easiest with a
  server route + `create_zip`-style package or signed URLs).
- **Edit/delete repository** from the dashboard.
- **File size/type restrictions** (enforce in upload code AND ideally via
  storage rules — e.g. max 10 MB per file, block executables).

### Phase 4 — Community
- **Stars**: buttons on repo cards using the existing `stars` table
  (insert/unstar, star counts, “starred by you” state).
- **Follow developers**: follow/unfollow buttons on profiles using `followers`.
- **Search improvements**: full-text search on descriptions, better profile search.
- **Repository README/description rendering** (optional markdown support).

### Phase 5 — Git integration (long term)
- Real `git clone` / `git push` requires server-side Git hosting (bare repos),
  which Supabase alone does not provide. Options: a VPS with bare repos +
  git-http-backend, or a third-party Git hosting API. Keep the current
  upload-based storage as the simple tier and add Git later for power users.

### Security hardening (recommended before launch)
- Password reset / recovery flow (`resetPasswordForEmail` + `/reset-password` page).
- Change password page (uses `updateUser`).
- Rate limiting on signup/login (Supabase has built-in email rate limits;
  add CAPTCHA in Supabase auth settings if abuse appears).
- Audit logging for repository deletion.
- Validate uploaded file types and sizes server-side before storage writes.
- Keep RLS on at all times — it is your main defense line, per SUPABASE-SECURITY.md.

---

## 5. Suggested build order

1. Connect Supabase and test auth + profile creation end-to-end.
2. Build the repository detail page + file upload (completes Phase 3 core).
3. Add the source code viewer and downloads.
4. Add stars and follows (Phase 4) — tables and policies already exist.
5. Improve search, then start Git integration research (Phase 5).

---

Built by Vector Codes. Founder: Prince Eric.

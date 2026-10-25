# VectorVault — Next Steps & Setup Guide

All application code is complete. Only **two things remain**: connecting your
Supabase database and deploying to hosting (Vercel).

---

## 1. What is built (complete)

- **Landing page** — hero, dashboard preview, features, about, footer, Explore link.
- **Authentication** — signup (with username), login, email verification,
  password reset (forgot-password page + email link), change password,
  session middleware, sign out.
- **Dashboard** — overview with repo stats and recent activity, empty states,
  sidebar navigation.
- **Repositories** — create, rename/edit, change visibility, delete (with file
  cleanup), My Repositories list, repository settings with danger zone.
- **Files** — upload (multi-file, 10 MB limit), file list, source code viewer,
  single-file download, delete, and **download repository as ZIP**
  (`/api/repos/[id]/zip`).
- **Profiles** — edit name/bio/location/website/GitHub/skills, public profile
  at `/username` with follower counts and public repos.
- **Community** — star repositories, follow developers (buttons + counts on
  repo and profile pages).
- **Explore** — browse and search public repositories and developers without
  an account.
- **Database** — `vectorvault/supabase/schema.sql` with all 5 tables
  (profiles, repositories, repository_files, stars, followers), full RLS
  policies, signup trigger, and storage buckets (`repo-files`, `avatars`).

---

## 2. Connect Supabase (REQUIRED — the app will not run without this)

1. Create a project at [supabase.com](https://supabase.com) (free tier works).
2. Open **SQL Editor → New query**, paste the entire contents of
   `vectorvault/supabase/schema.sql`, and run it. This creates the tables,
   RLS policies, the profile trigger, and storage buckets.
3. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `vectorvault/.env.example` to `vectorvault/.env.local` and paste your
   values. Never commit `.env.local`; never expose the `service_role` key.
5. In **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (dev) / your production domain later.
   - Redirect URLs: add `http://localhost:3000/auth/callback`.
6. Optionally enable email confirmations under
   **Authentication → Providers → Email**.
7. Install and run:
   ```bash
   cd vectorvault
   npm install
   npm run dev
   ```
8. Test the full flow: signup → (verify email) → dashboard → create repo →
   upload files → view source → star → download ZIP → edit profile →
   change password → visit `/your-username` → `/explore`.

---

## 3. Deploy to Vercel (REQUIRED)

1. Import the repo in Vercel with **root directory** set to `vectorvault`.
2. Add environment variables `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings.
3. Update Supabase **Authentication → URL Configuration**: set Site URL to
   your production domain and add `https://your-domain/auth/callback` to
   the redirect allow-list.
4. Deploy. Pushes to `main` auto-deploy from now on.

---

## 4. Optional polish (not required to launch)

- Syntax highlighting in the source viewer (e.g. shiki or prismjs).
- Avatar uploads to the `avatars` bucket (bucket + policies already exist;
  profile pictures currently fall back to initials).
- Search across repository descriptions (currently searches names and
  usernames).
- Rate limiting / CAPTCHA on auth (Supabase has basic email rate limits
  built in).
- Git clone/push integration (Phase 5 — needs server-side Git hosting;
  research a VPS with bare repos or a Git hosting API first).

---

Built by Vector Codes. Founder: Prince Eric.

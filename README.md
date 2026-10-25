# VectorVault

### Minimalist code hosting for Nigerian devs.

Built by Vector Codes.

---

## About

VectorVault is a code-hosting and developer platform designed to make storing, managing and sharing code simple and accessible.

We're building a platform with Nigerian student developers, freelancers and the wider African developer community in mind.

## Vision

Making code hosting simpler, more accessible and more connected.

## Features

- [x] User registration and authentication (email + password, email verification)
- [x] Password recovery and change password
- [x] Developer profiles (username, bio, skills, website, GitHub, location)
- [x] Public profile pages at `/username`
- [x] Repository creation, editing and deletion
- [x] Public and private repositories (protected by Row Level Security)
- [x] File uploads and secure storage (10 MB per file, Supabase Storage)
- [x] Source code viewer
- [x] Single-file and full repository ZIP downloads
- [x] Stars and follows
- [x] Explore page — browse and search public projects without an account
- [ ] Git integration (clone/push) — planned for a future phase

## Technology

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Vercel

## Getting Started

### 1. Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the full contents of `vectorvault/supabase/schema.sql`.
   This creates the tables, RLS policies, signup trigger and storage buckets.
3. Copy `vectorvault/.env.example` to `vectorvault/.env.local` and fill in
   your project URL and anon key.

### 2. Configure auth

In Supabase → Authentication → URL Configuration, set the Site URL to
`http://localhost:3000` and add `http://localhost:3000/auth/callback`
to the redirect allow-list.

### 3. Run the app

```bash
cd vectorvault
npm install
npm run dev
```

Open http://localhost:3000 and create your account.

### 4. Deploy

Import the repo in Vercel with root directory `vectorvault`, add the two
environment variables, and deploy. See `NEXT-STEPS.md` for the full guide.

## Project Structure

```
vectorvault/
├── supabase/schema.sql        # Tables, RLS policies, trigger, storage buckets
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Sign in
│   │   ├── signup/            # Registration
│   │   ├── forgot-password/   # Password recovery
│   │   ├── explore/           # Public projects & developer discovery
│   │   ├── auth/callback/     # Supabase auth callback
│   │   ├── api/repos/[id]/zip # Repository ZIP download
│   │   ├── dashboard/         # Overview, repositories, settings, profile
│   │   └── [username]/        # Public profiles and repository pages
│   ├── components/            # Forms, uploader, star/follow buttons, cards
│   ├── lib/supabase/          # Browser + server Supabase clients
│   └── middleware.ts          # Session refresh + dashboard protection
└── .env.example               # Environment variable template
```

## Documentation

Detailed planning and design documents live in the repo root:
`ARCHITECTURE.md`, `DATABASE.md`, `SUPABASE-SECURITY.md`, `DESIGN.md`,
`LANDING-PAGE.md`, `DASHBOARD.md`, `PROFILE.md`, `USER-FLOW.md`,
`FEATURES.md`, `ROADMAP.md`, and `NEXT-STEPS.md` (setup guide).

## Project Status

Application build complete. Remaining: connect Supabase and deploy to hosting.

## Founder

**Prince Eric**

Founder of Vector Codes.

---

© 2026 VectorVault. All rights reserved.

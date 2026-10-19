# VectorVault — System Architecture

## Overview

VectorVault is a minimalist code-hosting platform built for Nigerian developers.

The application will use a modern web architecture designed for simplicity, security and scalability.

## Technology Stack

### Frontend
- Next.js (App Router)
- React
- Tailwind CSS
- TypeScript

### Backend
- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage

### Hosting
- Vercel

### Version Control
- Git
- GitHub

## How Everything Connects

### 1. Next.js
Next.js powers the user interface and application logic.

It handles:
- Landing pages.
- User dashboards.
- Developer profiles.
- Repository pages.
- Application navigation.

### 2. Supabase

Supabase provides the backend infrastructure.

It handles:
- User authentication.
- Database management.
- Developer profiles.
- Repository information.
- File storage.

### 3. PostgreSQL

The database stores:
- User information.
- Developer profiles.
- Repository metadata.
- Repository permissions.
- Other application data.

### 4. Supabase Storage

Stores uploaded project files and profile pictures.

### 5. Vercel

Hosts and deploys the Next.js application.

## Security

Security will be a major priority.

- Row Level Security (RLS).
- Secure authentication.
- Private repository protection.
- Server-side authorization.
- Environment variable protection.
- Proper file access permissions.

## Initial Database Structure

Planned database tables:

1. profiles
2. repositories
3. repository_files
4. stars
5. followers

The final schema will be designed before implementation.

## Future Infrastructure

Advanced Git functionality may require dedicated infrastructure for:

- Git repositories.
- Clone and push operations.
- Commit history.
- Branch management.
- Repository processing.

These features will be introduced progressively.

## Development Philosophy

- Build small.
- Test frequently.
- Prioritize security.
- Keep the interface simple.
- Design for future growth.

---

Built by Vector Codes.

Founder: Prince Eric.

Project: VectorVault.
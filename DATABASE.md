# VectorVault — Database Design

## Overview

VectorVault uses Supabase PostgreSQL to manage application data.

The database is designed to support user accounts, developer profiles, repositories and future collaboration features.

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
| created_at | TIMESTAMPTZ | Creation date |
| updated_at | TIMESTAMPTZ | Last update |

## 3. Repository Files

Stores metadata about uploaded files.

| Column | Type | Description |
|---|---|---|
| id | UUID | File ID |
| repository_id | UUID | Associated repository |
| file_name | TEXT | File name |
| storage_path | TEXT | Supabase Storage location |
| file_size | BIGINT | File size |
| created_at | TIMESTAMPTZ | Upload date |

## 4. Stars Table

Tracks repositories bookmarked by developers.

| Column | Type | Description |
|---|---|---|
| id | UUID | Record ID |
| user_id | UUID | Developer |
| repository_id | UUID | Starred repository |
| created_at | TIMESTAMPTZ | Date starred |

## 5. Followers Table

Tracks relationships between developers.

| Column | Type | Description |
|---|---|---|
| id | UUID | Record ID |
| follower_id | UUID | Developer following |
| following_id | UUID | Developer being followed |
| created_at | TIMESTAMPTZ | Follow date |

## Database Relationships

- Each user has one developer profile.
- Each user can own multiple repositories.
- Each repository can contain multiple files.
- Users can star multiple repositories.
- Users can follow other developers.

## Security Strategy

VectorVault will use Supabase Row Level Security (RLS).

Security requirements:

- Users can edit their own profiles.
- Users can manage their own repositories.
- Private repositories must only be accessible to authorized users.
- Public repositories can be viewed by everyone.
- Users cannot modify another developer's data.
- Storage access must respect repository permissions.

## Important Notes

This document describes the planned database structure.

Actual SQL schemas, constraints, indexes and RLS policies will be implemented and tested during development.

Built by Vector Codes.

Founder: Prince Eric.
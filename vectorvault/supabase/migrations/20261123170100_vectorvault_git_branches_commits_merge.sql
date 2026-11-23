-- VectorVault Git-style branches, immutable commit snapshots and merge metadata.
create table if not exists public.repository_branches (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories(id) on delete cascade,
  name text not null,
  created_by uuid not null references public.profiles(id),
  head_commit_id uuid,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repository_branches_name_check check (name ~ '^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$'),
  constraint repository_branches_repo_name_unique unique(repository_id,name)
);
create unique index if not exists repository_branches_one_default on public.repository_branches(repository_id) where is_default;
create index if not exists repository_branches_repo_idx on public.repository_branches(repository_id);

create table if not exists public.repository_commits (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories(id) on delete cascade,
  branch_id uuid not null references public.repository_branches(id) on delete cascade,
  parent_commit_id uuid references public.repository_commits(id),
  merge_parent_commit_id uuid references public.repository_commits(id),
  author_id uuid not null references public.profiles(id),
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists repository_commits_branch_idx on public.repository_commits(branch_id,created_at desc);
create index if not exists repository_commits_repo_idx on public.repository_commits(repository_id,created_at desc);
alter table public.repository_branches add constraint repository_branches_head_commit_fkey foreign key(head_commit_id) references public.repository_commits(id) deferrable initially deferred;

create table if not exists public.repository_branch_files (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.repository_branches(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  storage_path text not null,
  file_size bigint not null default 0 check(file_size>=0),
  updated_at timestamptz not null default now(),
  unique(branch_id,file_path)
);
create index if not exists repository_branch_files_branch_idx on public.repository_branch_files(branch_id);

create table if not exists public.repository_commit_files (
  id uuid primary key default gen_random_uuid(),
  commit_id uuid not null references public.repository_commits(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  storage_path text,
  file_size bigint not null default 0 check(file_size>=0),
  change_type text not null default 'modified' check(change_type in ('added','modified','deleted')),
  unique(commit_id,file_path)
);
create index if not exists repository_commit_files_commit_idx on public.repository_commit_files(commit_id);

alter table public.repository_branches enable row level security;
alter table public.repository_commits enable row level security;
alter table public.repository_branch_files enable row level security;
alter table public.repository_commit_files enable row level security;

create policy "Visible repository branches are readable" on public.repository_branches for select to anon,authenticated using (
 exists(select 1 from public.repositories r where r.id=repository_id and
 (r.visibility='public' or r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted')))
);
create policy "Writers can create repository branches" on public.repository_branches for insert to authenticated with check (
 created_by=(select auth.uid()) and exists(select 1 from public.repositories r where r.id=repository_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
);
create policy "Writers can update repository branches" on public.repository_branches for update to authenticated using (
 exists(select 1 from public.repositories r where r.id=repository_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
) with check (
 exists(select 1 from public.repositories r where r.id=repository_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
);
create policy "Visible repository commits are readable" on public.repository_commits for select to anon,authenticated using (
 exists(select 1 from public.repositories r where r.id=repository_id and
 (r.visibility='public' or r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted')))
);
create policy "Writers can create repository commits" on public.repository_commits for insert to authenticated with check (
 author_id=(select auth.uid()) and exists(select 1 from public.repositories r where r.id=repository_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
);
create policy "Visible branch files are readable" on public.repository_branch_files for select to anon,authenticated using (
 exists(select 1 from public.repository_branches b join public.repositories r on r.id=b.repository_id where b.id=branch_id and
 (r.visibility='public' or r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted')))
);
create policy "Writers manage branch files" on public.repository_branch_files for all to authenticated using (
 exists(select 1 from public.repository_branches b join public.repositories r on r.id=b.repository_id where b.id=branch_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
) with check (
 exists(select 1 from public.repository_branches b join public.repositories r on r.id=b.repository_id where b.id=branch_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
);
create policy "Visible commit files are readable" on public.repository_commit_files for select to anon,authenticated using (
 exists(select 1 from public.repository_commits cm join public.repositories r on r.id=cm.repository_id where cm.id=commit_id and
 (r.visibility='public' or r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted')))
);
create policy "Writers create commit file snapshots" on public.repository_commit_files for insert to authenticated with check (
 exists(select 1 from public.repository_commits cm join public.repositories r on r.id=cm.repository_id where cm.id=commit_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
);
grant select on public.repository_branches,public.repository_commits,public.repository_branch_files,public.repository_commit_files to anon,authenticated;
grant insert,update on public.repository_branches to authenticated;
grant insert on public.repository_commits,public.repository_commit_files to authenticated;
grant insert,update,delete on public.repository_branch_files to authenticated;

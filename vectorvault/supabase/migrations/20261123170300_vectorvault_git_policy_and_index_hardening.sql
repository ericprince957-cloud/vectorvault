-- Tighten branch-file RLS and index Git-history foreign keys.
drop policy if exists "Writers manage branch files" on public.repository_branch_files;
create policy "Writers insert branch files" on public.repository_branch_files for insert to authenticated with check (
 exists(select 1 from public.repository_branches b join public.repositories r on r.id=b.repository_id where b.id=branch_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
);
create policy "Writers update branch files" on public.repository_branch_files for update to authenticated using (
 exists(select 1 from public.repository_branches b join public.repositories r on r.id=b.repository_id where b.id=branch_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
) with check (
 exists(select 1 from public.repository_branches b join public.repositories r on r.id=b.repository_id where b.id=branch_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
);
create policy "Writers delete branch files" on public.repository_branch_files for delete to authenticated using (
 exists(select 1 from public.repository_branches b join public.repositories r on r.id=b.repository_id where b.id=branch_id and
 (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
);
create index if not exists repository_branches_created_by_idx on public.repository_branches(created_by);
create index if not exists repository_branches_head_commit_idx on public.repository_branches(head_commit_id);
create index if not exists repository_commits_author_idx on public.repository_commits(author_id);
create index if not exists repository_commits_parent_idx on public.repository_commits(parent_commit_id);
create index if not exists repository_commits_merge_parent_idx on public.repository_commits(merge_parent_commit_id);

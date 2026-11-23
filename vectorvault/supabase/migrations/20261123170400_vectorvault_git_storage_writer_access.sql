-- Allow repository writers to upload branch objects and repository members to read them.
create policy "Repository writers can upload versioned files" on storage.objects
for insert to authenticated with check (
 bucket_id='repo-files' and (storage.foldername(name))[1]=(select auth.uid())::text
 and exists(select 1 from public.repositories r where r.id::text=(storage.foldername(name))[2]
 and (r.owner_id=(select auth.uid()) or exists(select 1 from public.repository_collaborators c
 where c.repository_id=r.id and c.user_id=(select auth.uid()) and c.status='accepted' and c.role in ('write','admin'))))
);
create policy "Repository members can read versioned files" on storage.objects
for select to anon,authenticated using (
 bucket_id='repo-files' and exists(select 1 from public.repositories r
 where r.id::text=(storage.foldername(name))[2] and
 (r.visibility='public' or r.owner_id=(select auth.uid()) or exists(
 select 1 from public.repository_collaborators c where c.repository_id=r.id
 and c.user_id=(select auth.uid()) and c.status='accepted')))
);

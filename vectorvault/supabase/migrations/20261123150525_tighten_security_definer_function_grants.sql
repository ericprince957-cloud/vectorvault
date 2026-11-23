-- Remove default PUBLIC execute access from privileged trigger/event functions.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- These SECURITY DEFINER helpers intentionally run inside RLS policies.
-- Keep the minimum API role grants required by those policies, but remove
-- the implicit PUBLIC grant so unrelated roles do not inherit access.
revoke execute on function public.can_view_repo(uuid) from public;
revoke execute on function public.can_view_issue(uuid) from public;
revoke execute on function public.is_repo_member(uuid) from public;
revoke execute on function public.is_repo_writer(uuid) from public;
revoke execute on function public.is_repo_admin(uuid) from public;

-- Invitation details are only for the authenticated invitee.
revoke execute on function public.invitation_repo_info(uuid) from public, anon;
grant execute on function public.invitation_repo_info(uuid) to authenticated;

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepoAccess } from "@/lib/repo-access";
import CollaboratorsPanel, {
  type CollaboratorView,
} from "@/components/collaborators/CollaboratorsPanel";

export default async function CollaboratorsSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS restricts the fetch to repositories the viewer can see.
  const { data: repo } = await supabase
    .from("repositories")
    .select("id, name, visibility, owner_id")
    .eq("id", id)
    .single();

  if (!repo) {
    notFound();
  }

  const access = await getRepoAccess(repo.id);

  // Only the owner or an accepted admin collaborator may manage
  // membership. Everything below is additionally enforced by
  // RLS, so a stale check can never grant real access.
  if (!access.isOwner && !access.canAdmin) {
    notFound();
  }

  const [{ data: ownerProfile }, { data: rows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username")
      .eq("id", repo.owner_id)
      .single(),
    supabase
      .from("repository_collaborators")
      .select(
        "id, user_id, role, invited_by, status, created_at"
      )
      .eq("repository_id", repo.id)
      .order("created_at", { ascending: true }),
  ]);

  // Resolve profile information for members and inviters.
  const memberIds = Array.from(
    new Set([
      ...(rows ?? []).map((row) => row.user_id),
      ...(rows ?? [])
        .map((row) => row.invited_by)
        .filter((value): value is string => Boolean(value)),
    ])
  );

  const { data: memberProfiles } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .in("id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map(
    (memberProfiles ?? []).map((profile) => [profile.id, profile])
  );

  const collaborators: CollaboratorView[] = (rows ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    username: profileMap.get(row.user_id)?.username ?? "unknown",
    full_name: profileMap.get(row.user_id)?.full_name ?? null,
    role: row.role as CollaboratorView["role"],
    status: row.status as CollaboratorView["status"],
    invited_by_username: row.invited_by
      ? profileMap.get(row.invited_by)?.username ?? null
      : null,
    created_at: row.created_at,
  }));

  const ownerUsername = ownerProfile?.username ?? "";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/repositories/${repo.id}/settings`}
            className="text-xs text-zinc-500 transition hover:text-white"
          >
            ← Repository settings
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Collaborators
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Invite developers to work on{" "}
            <span className="text-[#E5C76B]">{repo.name}</span>
            {repo.visibility === "private" && (
              <> — accepted collaborators also gain access to this private
              repository.</>
            )}
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-white/10 bg-[#141414] p-6">
        <h2 className="text-sm font-semibold">Roles</h2>
        <div className="mt-3 space-y-2 text-xs leading-6 text-zinc-500">
          <p>
            <span className="text-[#E5C76B]">read</span> — browse and download
            repository content. Cannot upload, edit or delete files.
          </p>
          <p>
            <span className="text-[#E5C76B]">write</span> — everything in read,
            plus uploading files, creating folders and editing content.
          </p>
          <p>
            <span className="text-[#E5C76B]">admin</span> — everything in write,
            plus managing collaborators and repository settings.
          </p>
          <p>
            <span className="text-[#E5C76B]">owner</span> — @{ownerUsername}{" "}
            always retains full control of this repository.
          </p>
        </div>
      </div>

      <CollaboratorsPanel
        repositoryId={repo.id}
        ownerUsername={ownerUsername}
        ownerUserId={repo.owner_id}
        canManage={access.isOwner || access.canAdmin}
        collaborators={collaborators}
      />
    </div>
  );
}

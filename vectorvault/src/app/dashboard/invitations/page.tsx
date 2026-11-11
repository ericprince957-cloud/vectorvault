import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InvitationActions from "@/components/collaborators/InvitationActions";

type InvitationRow = {
  id: string;
  repository_id: string;
  role: string;
  invited_by: string | null;
  created_at: string;
};

type RepoInfo = {
  repository_id: string;
  repository_name: string;
  owner_username: string;
  visibility: string;
};

export default async function InvitationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // RLS returns only the viewer's own invitation rows.
  const { data: invitations } = await supabase
    .from("repository_collaborators")
    .select("id, repository_id, role, invited_by, created_at")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const rows = (invitations ?? []) as InvitationRow[];

  // Repository information comes from a security-definer RPC:
  // a pending invitation must not itself grant repository
  // access, so only the name, owner username and visibility
  // are exposed for each invitation.
  const repoInfos: Record<string, RepoInfo> = {};

  for (const row of rows) {
    const { data: info } = await supabase
      .rpc("invitation_repo_info", { p_invitation: row.id });
    if (Array.isArray(info) && info.length > 0) {
      repoInfos[row.id] = info[0] as RepoInfo;
    }
  }

  // Inviter usernames for context.
  const inviterIds = Array.from(
    new Set(
      rows
        .map((row) => row.invited_by)
        .filter((value): value is string => Boolean(value))
    )
  );

  const { data: inviterProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in(
      inviterIds.length > 0
        ? inviterIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  const inviterMap = new Map(
    (inviterProfiles ?? []).map((profile) => [profile.id, profile.username])
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">
        Repository invitations
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Invitations other developers have sent you.
      </p>

      {rows.length > 0 ? (
        <div className="mt-8 space-y-4">
          {rows.map((row) => {
            const repoInfo = repoInfos[row.id];

            return (
              <div
                key={row.id}
                className="rounded-2xl border border-white/10 bg-[#141414] p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    {repoInfo ? (
                      <>
                        <p className="text-sm font-semibold text-[#E5C76B]">
                          {repoInfo.owner_username}/{repoInfo.repository_name}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {repoInfo.visibility} repository · invited{" "}
                          {new Date(row.created_at).toLocaleDateString()}
                          {row.invited_by &&
                            inviterMap.get(row.invited_by) &&
                            ` by @${inviterMap.get(row.invited_by)}`}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-[#E5C76B]">
                        Repository invitation
                      </p>
                    )}

                    <p className="mt-3 text-xs text-zinc-400">
                      Proposed role:{" "}
                      <span className="text-[#E5C76B]">{row.role}</span>
                    </p>
                  </div>

                  <InvitationActions invitationId={row.id} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-[#141414] p-12 text-center">
          <p className="font-medium">No pending invitations.</p>
          <p className="mt-2 text-sm text-zinc-500">
            When developers invite you to collaborate on a repository,
            the invitation will appear here.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B]"
          >
            Back to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

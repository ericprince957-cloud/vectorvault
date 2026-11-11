import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepoAccess } from "@/lib/repo-access";
import RepoSettingsForm from "@/components/RepoSettingsForm";

export default async function RepoSettingsPage({
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

  // RLS restricts the fetch; the access check below decides
  // whether the viewer may actually manage settings.
  const { data: repo } = await supabase
    .from("repositories")
    .select("id, name, description, visibility, topics, owner_id")
    .eq("id", id)
    .single();

  if (!repo) {
    notFound();
  }

  const access = await getRepoAccess(repo.id);

  // Owners manage everything; admin collaborators manage
  // collaboration and settings, but not deletion.
  if (!access.isOwner && !access.canAdmin) {
    notFound();
  }

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", repo.owner_id)
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/repositories"
            className="text-xs text-zinc-500 transition hover:text-white"
          >
            ← My repositories
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Repository settings
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Update details, visibility, topics, or delete this repository.
          </p>
        </div>
        <Link
          href={`/dashboard/repositories/${repo.id}/settings/collaborators`}
          className="rounded-lg border border-white/15 px-5 py-2.5 text-sm transition hover:border-[#C9A227]/60 hover:text-[#E5C76B]"
        >
          Collaborators →
        </Link>
      </div>

      <RepoSettingsForm
        repo={{
          id: repo.id,
          name: repo.name,
          description: repo.description,
          visibility: repo.visibility as "public" | "private",
          topics: (repo.topics as string[]) ?? [],
          ownerUsername: ownerProfile?.username ?? "",
        }}
      />
    </div>
  );
}

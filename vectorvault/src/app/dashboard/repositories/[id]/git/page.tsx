import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepoAccess } from "@/lib/repo-access";
import GitWorkspace from "@/components/GitWorkspace";

export default async function RepositoryGitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: repo } = await supabase.from("repositories")
    .select("id,name,owner_id,visibility").eq("id", id).maybeSingle();
  if (!repo) notFound();

  const access = await getRepoAccess(repo.id);
  if (repo.visibility !== "public" && !access.canRead) notFound();

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
      <Link href="/dashboard/repositories" className="mb-6 inline-flex text-xs text-zinc-500 hover:text-white">
        ← Repository workspace
      </Link>
      <GitWorkspace repositoryId={repo.id} repositoryName={repo.name} />
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepoAccess } from "@/lib/repo-access";
import IssueForm from "@/components/issues/IssueForm";

export default async function NewIssuePage({
  params,
}: {
  params: Promise<{ username: string; repo: string }>;
}) {
  const { username, repo } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  // RLS only returns repositories the viewer may see.
  const { data: repository } = await supabase
    .from("repositories")
    .select("id, name, visibility")
    .eq("owner_id", profile.id)
    .eq("name", repo)
    .single();

  if (!repository) {
    notFound();
  }

  const access = await getRepoAccess(repository.id);

  // Any signed-in developer may open issues on public
  // repositories; on private repositories only the owner and
  // accepted collaborators may.
  if (repository.visibility !== "public" && !access.isOwner && !access.canRead) {
    notFound();
  }

  const repoPath = `/${profile.username}/${repository.name}`;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 md:px-8">
      <Link
        href={`${repoPath}/issues`}
        className="text-sm text-zinc-500 transition hover:text-white"
      >
        ← Issues
      </Link>

      <h1 className="mt-8 text-3xl font-bold tracking-tight">
        New issue
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Report a problem or suggest a task for{" "}
        <span className="text-[#E5C76B]">
          {profile.username}/{repository.name}
        </span>
        .
      </p>

      <IssueForm repositoryId={repository.id} redirectTo={repoPath} />
    </main>
  );
}

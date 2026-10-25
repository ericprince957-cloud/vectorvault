import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const { data: repo } = await supabase
    .from("repositories")
    .select("id, name, description, visibility")
    .eq("id", id)
    .single();

  if (!repo || (repo as any).owner_id_check === false) {
    notFound();
  }

  // RLS already restricts to owned repos; double-check ownership anyway.
  const { data: owned } = await supabase
    .from("repositories")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!owned) {
    notFound();
  }

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
            Update details, visibility, or delete this repository.
          </p>
        </div>
      </div>

      <RepoSettingsForm
        repo={{
          id: repo.id,
          name: repo.name,
          description: repo.description,
          visibility: repo.visibility as "public" | "private",
          ownerUsername: "",
        }}
      />
    </div>
  );
}

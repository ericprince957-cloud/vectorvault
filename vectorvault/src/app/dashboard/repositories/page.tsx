import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MyRepositoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: repos } = await supabase
    .from("repositories")
    .select("id, name, description, visibility, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My repositories</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage and showcase your projects.
          </p>
        </div>
        <Link
          href="/dashboard/repositories/new"
          className="rounded-lg bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#E5C76B]"
        >
          + New repository
        </Link>
      </div>

      {repos && repos.length > 0 ? (
        <div className="space-y-3">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="rounded-xl border border-white/10 bg-[#141414] p-5 transition hover:border-[#C9A227]/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[#E5C76B]">
                      {repo.name}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
                      {repo.visibility}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {repo.description || "No description."}
                  </p>
                </div>
                <span className="text-xs text-zinc-600">
                  Updated {new Date(repo.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/15 bg-[#141414] p-12 text-center">
          <p className="font-medium">You have no repositories yet.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Repositories you create will appear here.
          </p>
          <Link
            href="/dashboard/repositories/new"
            className="mt-6 inline-block rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B]"
          >
            Create your first repository
          </Link>
        </div>
      )}
    </div>
  );
}

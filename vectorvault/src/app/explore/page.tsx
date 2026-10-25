import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let reposQuery = supabase
    .from("repositories")
    .select("id, name, description, updated_at, owner:profiles!repositories_owner_id_fkey(username, full_name)")
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .limit(30);

  if (q) {
    reposQuery = reposQuery.ilike("name", "%" + q + "%");
  }

  const [{ data: repos }, { data: profiles }] = await Promise.all([
    reposQuery,
    q
      ? supabase
          .from("profiles")
          .select("username, full_name, bio")
          .ilike("username", "%" + q + "%")
          .limit(10)
      : supabase
          .from("profiles")
          .select("username, full_name, bio")
          .order("created_at", { ascending: false })
          .limit(6),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-white">
          ← Back to VectorVault
        </Link>
        <Link
          href="/signup"
          className="rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#E5C76B]"
        >
          Get started
        </Link>
      </div>

      <h1 className="mt-10 text-3xl font-bold tracking-tight">
        Explore VectorVault
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Browse public repositories and discover developers. No account needed.
      </p>

      <form action="/explore" className="mt-8">
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="Search repositories or developers..."
          className="w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
        />
      </form>

      {/* Developers */}
      {profiles && profiles.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Developers</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {profiles.map((profile) => (
              <Link
                key={profile.username}
                href={"/" + profile.username}
                className="rounded-xl border border-white/10 bg-[#141414] p-5 transition hover:border-[#C9A227]/40"
              >
                <p className="font-medium text-[#E5C76B]">{profile.full_name || profile.username}</p>
                <p className="text-xs text-zinc-500">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{profile.bio}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Public repositories */}
      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Public repositories</h2>

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
                      <span className="font-medium text-[#E5C76B]">{repo.name}</span>
                      <span className="text-xs text-zinc-600">
                        by @{repo.owner?.username}
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
          <p className="rounded-xl border border-dashed border-white/15 bg-[#141414] p-10 text-center text-sm text-zinc-500">
            No public repositories found{q ? ' for "' + q + '"' : ""}.
          </p>
        )}
      </section>

      <p className="mt-16 text-center text-xs text-zinc-600">
        © 2026 VectorVault. Built by Vector Codes.
      </p>
    </main>
  );
}

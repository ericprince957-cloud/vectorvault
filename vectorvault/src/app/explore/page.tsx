import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TopicChips from "@/components/TopicChips";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; topic?: string }>;
}) {
  const { q, topic } = await searchParams;
  const supabase = await createClient();

  const cleanTopic = (topic || "").trim().toLowerCase();

  let reposQuery = supabase
    .from("repositories")
    .select(
      "id, name, description, topics, updated_at, owner:profiles!repositories_owner_id_fkey(username, full_name)"
    )
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .limit(30);

  if (q) {
    reposQuery = reposQuery.ilike("name", "%" + q + "%");
  }

  if (cleanTopic) {
    reposQuery = reposQuery.contains("topics", [cleanTopic]);
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

  const activeFilter = cleanTopic || q || "";

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

      <form action="/explore" className="mt-8 flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="Search repositories or developers..."
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#141414] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
        />
        {cleanTopic && (
          <input type="hidden" name="topic" value={cleanTopic} />
        )}
        <button
          type="submit"
          className="rounded-lg bg-[#C9A227] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B]"
        >
          Search
        </button>
      </form>

      {activeFilter && (
        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
          <span>
            Filtered by{" "}
            <span className="text-[#E5C76B]">
              {cleanTopic ? `topic: ${cleanTopic}` : `search: "${q}"`}
            </span>
          </span>
          <Link
            href="/explore"
            className="rounded-full border border-white/15 px-2.5 py-0.5 transition hover:border-white/40 hover:text-white"
          >
            Clear ×
          </Link>
        </div>
      )}

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
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/${repo.owner?.username}/${repo.name}`}
                        className="font-medium text-[#E5C76B] transition hover:text-white"
                      >
                        {repo.name}
                      </Link>
                      <span className="text-xs text-zinc-600">
                        by @{repo.owner?.username}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      {repo.description || "No description."}
                    </p>
                    <div className="mt-3">
                      <TopicChips
                        topics={(repo.topics as string[]) ?? []}
                        small
                      />
                    </div>
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
            No public repositories found{activeFilter ? ` for "${activeFilter}"` : ""}.
          </p>
        )}
      </section>

      <p className="mt-16 text-center text-xs text-zinc-600">
        © 2026 VectorVault. Built by Vector Codes.
      </p>
    </main>
  );
}

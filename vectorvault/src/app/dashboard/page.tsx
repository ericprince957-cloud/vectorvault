
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", user.id)
    .single();

  const { count: totalRepos } = await supabase
    .from("repositories")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id);

  const { count: publicRepos } = await supabase
    .from("repositories")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("visibility", "public");

  const { count: privateRepos } = await supabase
    .from("repositories")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("visibility", "private");

  const { data: recentRepos } = await supabase
    .from("repositories")
    .select("id, name, description, visibility, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: "Total repositories", value: totalRepos ?? 0 },
    { label: "Public", value: publicRepos ?? 0 },
    { label: "Private", value: privateRepos ?? 0 },
  ];

  const username = profile?.username;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {profile?.full_name?.split(" ")[0] || "developer"}.
        </h1>

        <p className="mt-2 text-sm text-zinc-400">
          @{username} — here is what is happening in your workspace.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-[0_14px_45px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:border-[#C9A227]/35"
          >
            <p className="text-3xl font-bold text-[#E5C76B]">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent repositories */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Recently updated
        </h2>

        {recentRepos && recentRepos.length > 0 ? (
          <div className="space-y-3">
            {recentRepos.map((repo) => (
              <Link
                key={repo.id}
                href={`/${username}/${encodeURIComponent(repo.name)}`}
                className="block rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl transition hover:border-[#C9A227]/45 hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
              >
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

                <p className="mt-3 text-xs text-[#E5C76B]">
                  Open repository →
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#C9A227]/25 bg-black/40 p-12 text-center backdrop-blur-xl">
            <p className="font-medium">No repositories yet.</p>

            <p className="mt-2 text-sm text-zinc-500">
              Create your first repository and start hosting your code on
              VectorVault.
            </p>

     </Link>
          </div>
        )}
      </div>
    </div>
  );
}

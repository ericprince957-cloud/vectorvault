import Link from "next/link";
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

  return (
    <div className="mx-auto max-w-4xl">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {profile?.full_name?.split(" ")[0] || "developer"}.
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          @{profile?.username} — here is what is happening in your workspace.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-[#141414] p-6"
          >
            <p className="text-3xl font-bold text-[#E5C76B]">{stat.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-10 flex flex-wrap gap-3">
        <Link
          href="/dashboard/repositories/new"
          className="rounded-lg bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#E5C76B]"
        >
          + Create repository
        </Link>
        <Link
          href="/dashboard/profile"
          className="rounded-lg border border-white/15 px-5 py-2.5 text-sm transition hover:border-white/40"
        >
          Edit profile
        </Link>
        <Link
          href={"/" + (profile?.username || "")}
          className="rounded-lg border border-white/15 px-5 py-2.5 text-sm transition hover:border-white/40"
        >
          View public profile
        </Link>
        <Link
          href="/explore"
          className="rounded-lg border border-white/15 px-5 py-2.5 text-sm transition hover:border-white/40"
        >
          Explore projects
        </Link>
      </div>

      {/* Recent repositories */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recently updated</h2>

        {recentRepos && recentRepos.length > 0 ? (
          <div className="space-y-3">
            {recentRepos.map((repo) => (
              <div
                key={repo.id}
                className="rounded-xl border border-white/10 bg-[#141414] p-5 transition hover:border-[#C9A227]/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[#E5C76B]">{repo.name}</span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
                    {repo.visibility}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {repo.description || "No description."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#141414] p-12 text-center">
            <p className="font-medium">No repositories yet.</p>
            <p className="mt-2 text-sm text-zinc-500">
              Create your first repository and start hosting your code on
              VectorVault.
            </p>
            <Link
              href="/dashboard/repositories/new"
              className="mt-6 inline-block rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B]"
            >
              Create repository
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

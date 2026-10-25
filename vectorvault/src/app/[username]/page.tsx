import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, avatar_url, website, location, github_url, skills, created_at")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: repos } = await supabase
    .from("repositories")
    .select("id, name, description, updated_at")
    .eq("owner_id", profile.id)
    .eq("visibility", "public")
    .order("updated_at", { ascending: false });

  const initials = (profile.full_name || profile.username)
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-12 md:px-8">
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
      >
        <Image
          src="/vectorvault-logo.png"
          alt="VectorVault logo"
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
        VectorVault
      </Link>

      {/* Profile header */}
      <div className="mt-10 flex flex-wrap items-center gap-6 border-b border-white/10 pb-10">
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt="Avatar"
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#C9A227]/20 text-2xl font-bold text-[#E5C76B]">
            {initials}
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.full_name || profile.username}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-400">
              {profile.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
            {profile.location && <span>📍 {profile.location}</span>}
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                🔗 Website
              </a>
            )}
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white"
              >
                GitHub
              </a>
            )}
            <span>
              Joined {new Date(profile.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-3 py-1 text-xs text-[#E5C76B]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Public repositories */}
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">
          Public repositories
        </h2>

        {repos && repos.length > 0 ? (
          <div className="space-y-3">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="rounded-xl border border-white/10 bg-[#141414] p-5 transition hover:border-[#C9A227]/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-medium text-[#E5C76B]">
                      {repo.name}
                    </span>
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
            This developer has no public repositories yet.
          </p>
        )}
      </div>

      <p className="mt-16 text-center text-xs text-zinc-600">
        © 2026 VectorVault. Built by Vector Codes.
      </p>
    </main>
  );
}

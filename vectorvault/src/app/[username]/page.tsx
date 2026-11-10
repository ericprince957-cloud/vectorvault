
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  github_url: string | null;
  skills: string[] | null;
};

type Repository = {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  updated_at: string;
};

function getExternalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  return /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, bio, website, location, github_url, skills"
    )
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === profile.id;

  const { data: repositories, error: repositoriesError } = await supabase
    .from("repositories")
    .select("id, name, description, visibility, updated_at")
    .eq("owner_id", profile.id)
    .eq("visibility", "public")
    .order("updated_at", { ascending: false });

  if (repositoriesError) {
    console.error("Could not load public repositories:", repositoriesError);
  }

  const publicRepositories = (repositories ?? []) as Repository[];
  const displayName = profile.full_name?.trim() || profile.username;
  const skills = Array.isArray(profile.skills) ? profile.skills : [];
  const websiteUrl = profile.website
    ? getExternalUrl(profile.website)
    : "";
  const githubUrl = profile.github_url
    ? getExternalUrl(profile.github_url)
    : "";

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12 md:px-8">
      {/* Navigation */}
      <div className="mb-12 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white"
        >
          Vector<span className="text-[#E5C76B]">Vault</span>
        </Link>

        {isOwner ? (
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:border-[#C9A227]/50 hover:text-white"
          >
            Dashboard →
          </Link>
        ) : (
          <Link
            href="/login"
            className="rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-300 transition hover:border-[#C9A227]/50 hover:text-white"
          >
            Sign in
          </Link>
        )}
      </div>

      {/* Developer profile */}
      <section className="border-b border-white/10 pb-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${displayName}'s profile picture`}
              className="h-28 w-28 shrink-0 rounded-full border border-white/10 bg-[#141414] object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 text-4xl font-bold text-[#E5C76B]">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {displayName}
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              @{profile.username}
            </p>

            {profile.bio && (
              <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                {profile.bio}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs text-zinc-500">
              {profile.location && (
                <span className="flex items-center gap-2">
                  <span>⌖</span>
                  {profile.location}
                </span>
              )}

              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E5C76B] transition hover:text-white"
                >
                  Website ↗
                </a>
              )}

              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  GitHub ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Skills & Technologies
            </h2>

            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-lg border border-white/10 bg-[#141414] px-3 py-1.5 text-xs text-zinc-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {isOwner && (
          <div className="mt-7">
            <Link
              href="/dashboard/profile"
              className="text-xs text-[#E5C76B] transition hover:text-white"
            >
              Edit your public profile →
            </Link>
          </div>
        )}
      </section>

      {/* Public repositories */}
      <section className="mt-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Public repositories
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Projects shared with the VectorVault community.
            </p>
          </div>

          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
            {publicRepositories.length} repositories
          </span>
        </div>

        {publicRepositories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {publicRepositories.map((repo) => (
              <article
                key={repo.id}
                className="rounded-xl border border-white/10 bg-[#141414] p-5 transition hover:border-[#C9A227]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/${profile.username}/${repo.name}`}
                    className="break-all text-sm font-semibold text-[#E5C76B] transition hover:text-white"
                  >
                    {repo.name}
                  </Link>

                  <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
                    Public
                  </span>
                </div>

                <p className="mt-3 min-h-10 text-xs leading-6 text-zinc-400">
                  {repo.description || "No description provided."}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-[10px] text-zinc-600">
                    Updated{" "}
                    {new Date(repo.updated_at).toLocaleDateString()}
                  </span>

                  <Link
                    href={`/${profile.username}/${repo.name}`}
                    className="text-xs text-zinc-400 transition hover:text-white"
                  >
                    View repository →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#141414] px-6 py-12 text-center">
            <div className="mb-3 text-2xl">📦</div>

            <h3 className="text-sm font-medium text-zinc-300">
              No public repositories yet
            </h3>

            <p className="mt-2 text-xs text-zinc-500">
              {isOwner
                ? "Your public projects will appear here when you create them."
                : "This developer has not published any repositories yet."}
            </p>

            {isOwner && (
              <Link
                href="/dashboard/repositories"
                className="mt-5 inline-block rounded-lg bg-[#C9A227] px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-[#E5C76B]"
              >
                View my repositories
              </Link>
            )}
          </div>
        )}
      </section>

      <footer className="mt-20 border-t border-white/10 pt-6 text-center">
        <p className="text-xs text-zinc-600">
          © 2026 VectorVault. Built by Vector Codes.
        </p>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepoAccess } from "@/lib/repo-access";
import { ISSUE_PRIORITIES } from "@/types/database";

type IssueRow = {
  id: string;
  author_id: string;
  title: string;
  status: string;
  priority: string;
  labels: string[] | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

const PRIORITY_BADGE: Record<string, string> = {
  low: "border-white/15 text-zinc-400",
  normal: "border-white/15 text-zinc-300",
  high: "border-[#C9A227]/50 text-[#E5C76B]",
  urgent: "border-red-500/40 text-red-400",
};

export default async function IssuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; repo: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    label?: string;
  }>;
}) {
  const { username, repo } = await params;
  const { q, status, priority, label } = await searchParams;

  const supabase = await createClient();

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

  if (repository.visibility !== "public" && !access.isOwner && !access.canRead) {
    notFound();
  }

  const [{ count: openCount }, { count: closedCount }] = await Promise.all([
    supabase
      .from("issues")
      .select("*", { count: "exact", head: true })
      .eq("repository_id", repository.id)
      .eq("status", "open"),
    supabase
      .from("issues")
      .select("*", { count: "exact", head: true })
      .eq("repository_id", repository.id)
      .eq("status", "closed"),
  ]);

  const cleanStatus = status === "open" || status === "closed" ? status : null;
  const cleanPriority =
    priority && ISSUE_PRIORITIES.includes(priority as never)
      ? priority
      : null;
  const cleanLabel = (label || "").trim().toLowerCase();
  const cleanQuery = (q || "").trim();

  let query = supabase
    .from("issues")
    .select(
      "id, author_id, title, status, priority, labels, created_at, updated_at, closed_at"
    )
    .eq("repository_id", repository.id);

  if (cleanQuery) {
    query = query.ilike("title", `%${cleanQuery}%`);
  }

  if (cleanStatus) {
    query = query.eq("status", cleanStatus);
  }

  if (cleanPriority) {
    query = query.eq("priority", cleanPriority);
  }

  if (cleanLabel) {
    query = query.contains("labels", [cleanLabel]);
  }

  const { data: issues, error: issuesError } = await query
    .order("created_at", { ascending: false })
    .limit(50);

  if (issuesError) {
    console.error("Could not load issues:", issuesError.message);
  }

  const rows = (issues ?? []) as IssueRow[];

  // Author usernames, resolved in a second query.
  const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
  const { data: authorProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in(
      authorIds.length > 0
        ? authorIds
        : ["00000000-0000-0000-0000-000000000000"]
    );

  const authorMap = new Map(
    (authorProfiles ?? []).map((item) => [item.id, item.username])
  );

  const repoPath = `/${profile.username}/${repository.name}`;
  const canCreate =
    access.isAuthenticated &&
    (repository.visibility === "public" || access.isOwner || access.canRead);

  function tabHref(target: "open" | "closed" | "all") {
    const search = new URLSearchParams();
    if (cleanQuery) search.set("q", cleanQuery);
    if (target !== "all") search.set("status", target);
    if (cleanPriority) search.set("priority", cleanPriority);
    if (cleanLabel) search.set("label", cleanLabel);
    const suffix = search.toString();
    return `${repoPath}/issues${suffix ? "?" + suffix : ""}`;
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={repoPath}
          className="text-sm text-zinc-500 transition hover:text-white"
        >
          ← {profile.username}/{repository.name}
        </Link>

        {canCreate && (
          <Link
            href={`${repoPath}/issues/new`}
            className="rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#E5C76B]"
          >
            + New issue
          </Link>
        )}
      </div>

      <h1 className="mt-8 text-3xl font-bold tracking-tight">
        Issues
      </h1>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <Link
          href={tabHref("open")}
          className={
            "rounded-lg border px-4 py-1.5 transition " +
            (cleanStatus === "open"
              ? "border-[#C9A227] bg-[#C9A227]/10 text-[#E5C76B]"
              : "border-white/15 text-zinc-400 hover:border-white/40")
          }
        >
          {openCount ?? 0} open
        </Link>
        <Link
          href={tabHref("closed")}
          className={
            "rounded-lg border px-4 py-1.5 transition " +
            (cleanStatus === "closed"
              ? "border-[#C9A227] bg-[#C9A227]/10 text-[#E5C76B]"
              : "border-white/15 text-zinc-400 hover:border-white/40")
          }
        >
          {closedCount ?? 0} closed
        </Link>
        <Link
          href={tabHref("all")}
          className={
            "rounded-lg border px-4 py-1.5 transition " +
            (!cleanStatus
              ? "border-[#C9A227] bg-[#C9A227]/10 text-[#E5C76B]"
              : "border-white/15 text-zinc-400 hover:border-white/40")
          }
        >
          All
        </Link>
      </div>

      <form
        action={`${repoPath}/issues`}
        className="mt-6 grid gap-3 rounded-xl border border-white/10 bg-[#141414] p-4 sm:grid-cols-4"
      >
        <input
          type="text"
          name="q"
          defaultValue={cleanQuery}
          placeholder="Search titles..."
          className="rounded-lg border border-white/10 bg-[#090909] px-3 py-2.5 text-sm outline-none transition focus:border-[#C9A227]/60 sm:col-span-2"
        />
        <select
          name="priority"
          defaultValue={cleanPriority ?? ""}
          aria-label="Filter by priority"
          className="rounded-lg border border-white/10 bg-[#090909] px-3 py-2.5 text-sm outline-none transition focus:border-[#C9A227]/60"
        >
          <option value="">Any priority</option>
          {ISSUE_PRIORITIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="text"
            name="label"
            defaultValue={cleanLabel}
            placeholder="label"
            aria-label="Filter by label"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#090909] px-3 py-2.5 text-sm outline-none transition focus:border-[#C9A227]/60"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#C9A227] px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-[#E5C76B]"
          >
            Filter
          </button>
        </div>
        {cleanStatus && <input type="hidden" name="status" value={cleanStatus} />}
      </form>

      <div className="mt-8 space-y-3">
        {rows.length > 0 ? (
          rows.map((issue) => (
            <Link
              key={issue.id}
              href={`${repoPath}/issues/${issue.id}`}
              className="block rounded-xl border border-white/10 bg-[#141414] p-5 transition hover:border-[#C9A227]/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm">
                  {issue.status === "open" ? "🐞" : "✅"}
                </span>
                <span className="font-medium text-[#E5C76B]">
                  {issue.title}
                </span>

                <span
                  className={
                    "rounded-full border px-2 py-0.5 text-[10px] " +
                    (PRIORITY_BADGE[issue.priority] ??
                      PRIORITY_BADGE.normal)
                  }
                >
                  {issue.priority}
                </span>

                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
                  {issue.status}
                </span>
              </div>

              {(issue.labels ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(issue.labels ?? []).map((labelText) => (
                    <span
                      key={labelText}
                      className="rounded-full border border-[#C9A227]/25 bg-[#C9A227]/10 px-2 py-0.5 text-[10px] text-[#E5C76B]"
                    >
                      {labelText}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 text-[11px] text-zinc-600">
                opened {new Date(issue.created_at).toLocaleDateString()} by @
                {authorMap.get(issue.author_id) ?? "unknown"}
                {issue.status === "closed" && issue.closed_at
                  ? ` · closed ${new Date(issue.closed_at).toLocaleDateString()}`
                  : ""}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#141414] p-12 text-center">
            <p className="font-medium">No issues here.</p>
            <p className="mt-2 text-sm text-zinc-500">
              {cleanQuery || cleanPriority || cleanLabel || cleanStatus
                ? "Try clearing the filters."
                : "This repository has no issues yet."}
            </p>
          </div>
        )}
      </div>

      <p className="mt-16 text-center text-xs text-zinc-600">
        © 2026 VectorVault. Built by Vector Codes.
      </p>
    </main>
  );
}

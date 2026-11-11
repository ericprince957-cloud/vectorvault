import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRepoAccess } from "@/lib/repo-access";
import IssueStatusControls from "@/components/issues/IssueStatusControls";
import IssueEditor from "@/components/issues/IssueEditor";
import AssigneeControl from "@/components/issues/AssigneeControl";
import CommentSection, { type CommentView } from "@/components/issues/CommentSection";

const PRIORITY_BADGE: Record<string, string> = {
  low: "border-white/15 text-zinc-400",
  normal: "border-white/15 text-zinc-300",
  high: "border-[#C9A227]/50 text-[#E5C76B]",
  urgent: "border-red-500/40 text-red-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ username: string; repo: string; issueId: string }>;
}) {
  const { username, repo, issueId } = await params;

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS restricts issue rows to viewers who can see the repository.
  const { data: issue } = await supabase
    .from("issues")
    .select(
      "id, repository_id, author_id, title, body, status, priority, labels, assignee_id, created_at, updated_at, closed_at"
    )
    .eq("id", issueId)
    .eq("repository_id", repository.id)
    .maybeSingle();

  if (!issue) {
    notFound();
  }

  const labels = (issue.labels as string[] | null) ?? [];
  const isOpen = issue.status !== "closed";

  const canManage =
    access.isOwner || access.canAdmin || (!!user && issue.author_id === user.id);
  const canModerate = access.isOwner || access.canAdmin;
  const canComment = !!user;

  // Author, assignee and comment author profiles are fetched with
  // separate queries (profiles is readable by all authenticated users).
  const [authorResult, assigneeResult, commentsResult, collaboratorsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", issue.author_id)
        .maybeSingle(),
      issue.assignee_id
        ? supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", issue.assignee_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("issue_comments")
        .select("id, author_id, body, created_at, updated_at")
        .eq("issue_id", issue.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("repository_collaborators")
        .select("user_id, role")
        .eq("repository_id", repository.id)
        .eq("status", "accepted"),
    ]);

  const comments = commentsResult.data ?? [];
  const commentAuthorIds = Array.from(
    new Set(comments.map((c) => c.author_id as string))
  );

  const collaboratorIds = (collaboratorsResult.data ?? []).map(
    (c) => c.user_id as string
  );

  // Everyone who may be assigned: the owner plus accepted collaborators.
  const eligibleIds = Array.from(
    new Set([profile.id, ...collaboratorIds])
  );

  const [commentAuthorsResult, eligibleProfilesResult] = await Promise.all([
    commentAuthorIds.length
      ? supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", commentAuthorIds)
      : Promise.resolve({ data: [] }),
    eligibleIds.length
      ? supabase
          .from("profiles")
          .select("id, username")
          .in("id", eligibleIds)
      : Promise.resolve({ data: [] }),
  ]);

  const authorById = new Map<string, { username: string | null; avatar_url: string | null }>();
  for (const row of commentAuthorsResult.data ?? []) {
    authorById.set(row.id as string, {
      username: (row.username as string) ?? null,
      avatar_url: (row.avatar_url as string) ?? null,
    });
  }

  const commentViews: CommentView[] = comments.map((c) => {
    const author = authorById.get(c.author_id as string);
    return {
      id: c.id as string,
      author_id: c.author_id as string,
      author_username: author?.username ?? null,
      author_avatar: author?.avatar_url ?? null,
      body: c.body as string,
      created_at: c.created_at as string,
      updated_at: c.updated_at ?? null,
    };
  });

  const eligibleAssignees = (eligibleProfilesResult.data ?? []).map((p) => ({
    id: p.id as string,
    username: (p.username as string) ?? "unknown",
  }));

  const repoPath = `/${username}/${repo}`;
  const issuesPath = `${repoPath}/issues`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        <Link href={repoPath} className="transition hover:text-[#E5C76B]">
          {username}/{repo}
        </Link>
        <span>/</span>
        <Link href={issuesPath} className="transition hover:text-[#E5C76B]">
          Issues
        </Link>
        <span>/</span>
        <span className="text-zinc-300">
          #{issue.id.slice(0, 8)}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6 border-b border-zinc-800 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            {issue.title}
          </h1>
          <span
            className={`rounded-full border px-3 py-1 text-xs ${
              isOpen
                ? "border-emerald-500/40 text-emerald-400"
                : "border-white/15 text-zinc-400"
            }`}
          >
            {isOpen ? "● Open" : "✓ Closed"}
          </span>
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          <span className="text-[#E5C76B]">
            {authorResult.data?.username ?? "unknown"}
          </span>{" "}
          opened this issue on {formatDate(issue.created_at)}
          {!isOpen && issue.closed_at && (
            <> · closed on {formatDate(issue.closed_at)}</>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Main column: description + comments */}
        <div className="min-w-0">
          <IssueEditor
            issueId={issue.id}
            title={issue.title}
            body={issue.body ?? ""}
            priority={issue.priority}
            labels={labels}
            canEdit={canManage}
          />

          <div className="mt-4 rounded-lg border border-zinc-800 bg-[#141414] p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
              {issue.body?.trim() || "_No description provided._"}
            </p>
          </div>

          {/* Comments */}
          <div className="mt-8">
            <h2 className="mb-4 text-sm font-medium text-zinc-300">
              {commentViews.length}{" "}
              {commentViews.length === 1 ? "comment" : "comments"}
            </h2>
            <CommentSection
              issueId={issue.id}
              comments={commentViews}
              currentUserId={user?.id ?? ""}
              canComment={canComment}
              canModerate={canModerate}
            />
          </div>
        </div>

        {/* Sidebar: controls + metadata */}
        <aside className="space-y-5">
          <div className="rounded-lg border border-zinc-800 bg-[#141414] p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Manage
            </h3>
            <IssueStatusControls
              issueId={issue.id}
              status={isOpen ? "open" : "closed"}
              canManage={canManage}
              issuesPath={issuesPath}
            />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#141414] p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Priority
            </h3>
            <span
              className={`rounded-full border px-3 py-1 text-xs capitalize ${
                PRIORITY_BADGE[issue.priority] ?? PRIORITY_BADGE.normal
              }`}
            >
              {issue.priority}
            </span>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#141414] p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Assignee
            </h3>
            {assigneeResult.data?.username ? (
              <p className="mb-2 text-xs text-zinc-500">
                Assigned to{" "}
                <span className="text-[#E5C76B]">
                  {assigneeResult.data.username}
                </span>
              </p>
            ) : (
              <p className="mb-2 text-xs text-zinc-600">No one — assign yourself</p>
            )}
            <AssigneeControl
              issueId={issue.id}
              assigneeId={issue.assignee_id ?? null}
              eligible={eligibleAssignees}
              canAssign={canManage}
            />
          </div>

          <div className="rounded-lg border border-zinc-800 bg-[#141414] p-4">
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Labels
            </h3>
            {labels.length ? (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 px-2.5 py-0.5 text-xs text-[#E5C76B]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-600">No labels</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

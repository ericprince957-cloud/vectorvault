"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface CommentView {
  id: string;
  author_id: string;
  author_username: string | null;
  author_avatar: string | null;
  body: string;
  created_at: string;
  updated_at: string | null;
}

function timeAgo(iso: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Discussion thread under an issue. Editing is limited to the
// comment author; deletion is available to the author and to
// repository owners/admin collaborators (both rules are also
// enforced by RLS on issue_comments).

export default function CommentSection({
  issueId,
  comments,
  currentUserId,
  canComment,
  canModerate,
}: {
  issueId: string;
  comments: CommentView[];
  currentUserId: string;
  canComment: boolean;
  canModerate: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd() {
    if (!body.trim()) return;

    setPosting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("issue_comments")
        .insert({
          issue_id: issueId,
          author_id: currentUserId,
          body: body.trim(),
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setBody("");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPosting(false);
    }
  }

  async function handleSaveEdit(commentId: string) {
    if (!editBody.trim()) return;

    setBusyId(commentId);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("issue_comments")
        .update({ body: editBody.trim() })
        .eq("id", commentId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setEditingId(null);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("Delete this comment?")) return;

    setBusyId(commentId);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("issue_comments")
        .delete()
        .eq("id", commentId);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {canComment && (
        <div className="mb-6">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Write a comment..."
            className="w-full rounded-lg border border-zinc-800 bg-[#090909] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A227]/60"
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          <button
            type="button"
            onClick={handleAdd}
            disabled={posting || !body.trim()}
            className="mt-2 rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-medium text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
          >
            {posting ? "Commenting..." : "Comment"}
          </button>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-zinc-500">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const isOwn = comment.author_id === currentUserId;
            const canEdit = isOwn;
            const canDelete = isOwn || canModerate;

            return (
              <li
                key={comment.id}
                className="rounded-lg border border-zinc-800 bg-[#141414] p-4"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  {comment.author_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.author_avatar}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A227]/20 text-[10px] text-[#E5C76B]">
                      {(comment.author_username ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[#E5C76B]">
                    {comment.author_username ?? "Unknown"}
                  </span>
                  <span>{timeAgo(comment.created_at)}</span>
                  {comment.updated_at && (
                    <span className="text-zinc-600">· edited</span>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-zinc-800 bg-[#090909] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A227]/60"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={busyId === comment.id || !editBody.trim()}
                        className="rounded-lg bg-[#C9A227] px-3 py-1.5 text-xs font-medium text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
                      >
                        {busyId === comment.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-800/40"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="whitespace-pre-wrap text-sm text-zinc-200">
                      {comment.body}
                    </p>

                    {(canEdit || canDelete) && (
                      <div className="mt-2 flex gap-3 text-xs">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditBody(comment.body);
                            }}
                            className="text-zinc-500 transition hover:text-[#E5C76B]"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(comment.id)}
                            disabled={busyId === comment.id}
                            className="text-zinc-500 transition hover:text-red-400 disabled:opacity-50"
                          >
                            {busyId === comment.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

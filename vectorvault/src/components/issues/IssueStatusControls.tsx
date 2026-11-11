"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Close / reopen / delete controls for an issue. Every mutation
// is additionally enforced by RLS: only the issue author, the
// repository owner or an admin collaborator can use them.

export default function IssueStatusControls({
  issueId,
  status,
  canManage,
  issuesPath,
}: {
  issueId: string;
  status: "open" | "closed";
  canManage: boolean;
  issuesPath: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "status" | "delete">(null);
  const [error, setError] = useState<string | null>(null);

  if (!canManage) {
    return null;
  }

  async function setStatus(next: "open" | "closed") {
    setBusy("status");
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("issues")
        .update({
          status: next,
          // A database trigger also keeps closed_at in sync.
          closed_at: next === "closed" ? new Date().toISOString() : null,
        })
        .eq("id", issueId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this issue and all of its comments? This cannot be undone."
      )
    ) {
      return;
    }

    setBusy("delete");
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("issues")
        .delete()
        .eq("id", issueId);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      router.push(issuesPath);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {status === "open" ? (
          <button
            type="button"
            onClick={() => setStatus("closed")}
            disabled={busy !== null}
            className="rounded-lg border border-[#C9A227]/40 px-4 py-2 text-xs text-[#E5C76B] transition hover:bg-[#C9A227]/10 disabled:opacity-50"
          >
            {busy === "status" ? "Closing..." : "✓ Close issue"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStatus("open")}
            disabled={busy !== null}
            className="rounded-lg border border-[#C9A227]/40 px-4 py-2 text-xs text-[#E5C76B] transition hover:bg-[#C9A227]/10 disabled:opacity-50"
          >
            {busy === "status" ? "Reopening..." : "↻ Reopen issue"}
          </button>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={busy !== null}
          className="rounded-lg border border-red-500/30 px-4 py-2 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          {busy === "delete" ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

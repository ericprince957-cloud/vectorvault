"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Assign / unassign an issue. Only rendered for the issue author,
// repository owner or an admin collaborator; RLS enforces the same
// rule on update. Eligible assignees are passed in from the server
// page (owner + accepted collaborators with read access or better).

export default function AssigneeControl({
  issueId,
  assigneeId,
  eligible,
  canAssign,
}: {
  issueId: string;
  assigneeId: string | null;
  eligible: { id: string; username: string }[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canAssign) {
    return null;
  }

  async function updateAssignee(userId: string) {
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("issues")
        .update({ assignee_id: userId === "" ? null : userId })
        .eq("id", issueId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-1 text-xs text-red-400">{error}</p>}
      <select
        value={assigneeId ?? ""}
        onChange={(e) => updateAssignee(e.target.value)}
        disabled={busy}
        className="w-full rounded-lg border border-zinc-800 bg-[#090909] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A227]/60 disabled:opacity-50"
      >
        <option value="">No assignee</option>
        {eligible.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username}
          </option>
        ))}
      </select>
    </div>
  );
}

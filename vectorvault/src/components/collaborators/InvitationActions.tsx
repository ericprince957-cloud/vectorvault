"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Accept / decline controls for one repository invitation.
// RLS lets the invitee update only the status of their own
// pending invitation, so nothing here can be abused.

export default function InvitationActions({
  invitationId,
}: {
  invitationId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "accept" | "decline">(null);
  const [error, setError] = useState<string | null>(null);

  async function respond(status: "accepted" | "declined") {
    setBusy(status === "accepted" ? "accept" : "decline");
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("repository_collaborators")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", invitationId);

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

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => respond("accepted")}
          disabled={busy !== null}
          className="rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
        >
          {busy === "accept" ? "Accepting..." : "Accept"}
        </button>
        <button
          type="button"
          onClick={() => respond("declined")}
          disabled={busy !== null}
          className="rounded-lg border border-white/15 px-4 py-2 text-xs text-zinc-300 transition hover:border-white/40 disabled:opacity-50"
        >
          {busy === "decline" ? "Declining..." : "Decline"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

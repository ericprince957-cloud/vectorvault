
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteFileButton({
  fileId,
  storagePath,
}: {
  fileId: string;
  storagePath: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm("Delete this file? This cannot be undone.")) return;

    setDeleting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Keep the immutable object if any commit snapshot references it.
      const { count: snapshotReferences } = await supabase
        .from("repository_commit_files")
        .select("*", { count: "exact", head: true })
        .eq("storage_path", storagePath);

      if ((snapshotReferences ?? 0) === 0) {
        const { error: storageError } = await supabase.storage
          .from("repo-files")
          .remove([storagePath]);
        if (storageError) {
          setError("Storage error: " + storageError.message);
          return;
        }
      }

      // Remove it from the current working tree while preserving commit snapshots.
      await supabase.from("repository_branch_files").delete().eq("storage_path", storagePath);

      // Remove its legacy repository file record.
      const { error: databaseError } = await supabase
        .from("repository_files")
        .delete()
        .eq("id", fileId);

      if (databaseError) {
        setError("Database error: " + databaseError.message);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong while deleting this file.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs text-zinc-500 transition hover:text-red-400 disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <p className="max-w-xs text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

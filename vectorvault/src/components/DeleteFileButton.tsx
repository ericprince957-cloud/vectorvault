"use client";

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

  async function handleDelete() {
    if (!confirm("Delete this file? This cannot be undone.")) return;

    const supabase = createClient();

    await supabase.storage.from("repo-files").remove([storagePath]);
    await supabase.from("repository_files").delete().eq("id", fileId);

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-xs text-zinc-500 transition hover:text-red-400"
    >
      Delete
    </button>
  );
}

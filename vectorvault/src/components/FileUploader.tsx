"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function FileUploader({
  repositoryId,
  ownerId,
}: {
  repositoryId: string;
  ownerId: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== ownerId) {
      setError("Only the repository owner can upload files.");
      setUploading(false);
      return;
    }

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        setError("Each file must be 10 MB or smaller: " + file.name);
        continue;
      }

      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = user.id + "/" + repositoryId + "/" + Date.now() + "-" + cleanName;

      const { error: uploadError } = await supabase.storage
        .from("repo-files")
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        setError("Could not upload " + file.name + ": " + uploadError.message);
        continue;
      }

      const { error: insertError } = await supabase.from("repository_files").insert({
        repository_id: repositoryId,
        file_name: cleanName,
        storage_path: storagePath,
        file_size: file.size,
      });

      if (insertError) {
        setError("Could not register " + file.name + ": " + insertError.message);
      }
    }

    setUploading(false);
    e.target.value = "";
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-[#141414] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Upload files</p>
          <p className="mt-1 text-xs text-zinc-500">
            Max 10 MB per file. Files are stored securely in Supabase Storage.
          </p>
        </div>

        <label className="cursor-pointer rounded-lg bg-[#C9A227] px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-[#E5C76B]">
          {uploading ? "Uploading..." : "Choose files"}
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
  const [progress, setProgress] = useState("");
  const [detectedFiles, setDetectedFiles] = useState<string[]>([]);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = input.files;

    if (!files || files.length === 0) {
      setError("No files were detected. Please select a folder containing files.");
      return;
    }

    const selectedFiles = Array.from(files);
    const getRelativePath = (file: File) =>
      (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

    setDetectedFiles(selectedFiles.map(getRelativePath));
    setUploading(true);
    setError(null);
    setProgress(`Browser detected ${selectedFiles.length} file(s). Starting upload...`);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.id !== ownerId) {
        throw new Error("Only the repository owner can upload files.");
      }

      let successful = 0;
      const errors: string[] = [];

      for (const file of selectedFiles) {
        const relativePath = getRelativePath(file);

        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${relativePath}: exceeds the 10 MB limit`);
          continue;
        }

        const safePath = relativePath
          .split("/")
          .filter((part) => part && part !== "." && part !== "..")
          .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "_"))
          .join("/");

        if (!safePath) {
          errors.push(`${relativePath}: invalid file path`);
          continue;
        }

        const fileName = safePath.split("/").pop()!;
        const storagePath = `${user.id}/${repositoryId}/${Date.now()}-${successful}/${safePath}`;

        const { error: uploadError } = await supabase.storage
          .from("repo-files")
          .upload(storagePath, file, { upsert: false });

        if (uploadError) {
          errors.push(`${relativePath}: ${uploadError.message}`);
          continue;
        }

        const { error: insertError } = await supabase
          .from("repository_files")
          .insert({
            repository_id: repositoryId,
            file_name: fileName,
            file_path: safePath,
            storage_path: storagePath,
            file_size: file.size,
          });

        if (insertError) {
          await supabase.storage.from("repo-files").remove([storagePath]);
          errors.push(`${relativePath}: ${insertError.message}`);
          continue;
        }

        successful++;
        setProgress(`Uploaded ${successful} of ${selectedFiles.length} files`);
      }

      if (errors.length > 0) {
        setError(`${successful} uploaded successfully. ${errors.length} failed:\n${errors.slice(0, 10).join("\n")}`);
      }

      setProgress(`Finished: ${successful} of ${selectedFiles.length} files uploaded successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setUploading(false);
      input.value = "";
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-[#141414] p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Upload to repository</p>
          <p className="mt-1 text-xs text-zinc-500">Upload individual files or entire folders. Max 10 MB per file.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className={`cursor-pointer rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium transition hover:bg-white/10 ${uploading ? "pointer-events-none opacity-50" : ""}`}>
            Choose files
            <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>

          <label className={`cursor-pointer rounded-lg bg-[#C9A227] px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-[#E5C76B] ${uploading ? "pointer-events-none opacity-50" : ""}`}>
            Choose folder
            <input
              type="file"
              multiple
              ref={(input) => {
                if (input) input.setAttribute("webkitdirectory", "");
              }}
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {progress && <p className="mt-4 text-xs text-[#E5C76B]">{progress}</p>}

      {detectedFiles.length > 0 && (
        <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="mb-2 text-xs font-medium text-zinc-300">Detected files ({detectedFiles.length})</p>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {detectedFiles.slice(0, 30).map((path, index) => (
              <p key={`${path}-${index}`} className="break-all text-xs text-zinc-500">{path}</p>
            ))}
            {detectedFiles.length > 30 && <p className="text-xs text-zinc-500">And {detectedFiles.length - 30} more...</p>}
          </div>
        </div>
      )}

      {error && <p className="mt-4 whitespace-pre-line rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}

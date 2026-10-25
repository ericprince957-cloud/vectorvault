import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FileUploader from "@/components/FileUploader";
import DeleteFileButton from "@/components/DeleteFileButton";

export default async function RepositoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; repo: string }>;
  searchParams: Promise<{ file?: string }>;
}) {
  const { username, repo } = await params;
  const { file: selectedFileId } = await searchParams;

  const supabase = await createClient();

  // Owner profile + repository
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: repository } = await supabase
    .from("repositories")
    .select("id, owner_id, name, description, visibility, updated_at")
    .eq("owner_id", profile.id)
    .eq("name", repo)
    .single();

  if (!repository) notFound();

  // Visibility check: private repos are only for the owner
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === repository.owner_id;

  if (repository.visibility !== "public" && !isOwner) {
    notFound();
  }

  // File list
  const { data: files } = await supabase
    .from("repository_files")
    .select("id, file_name, storage_path, file_size, created_at")
    .eq("repository_id", repository.id)
    .order("created_at", { ascending: false });

  // Selected file content (source viewer)
  let selectedFile: (typeof files)[number] | null = null;
  let fileContent: string | null = null;
  let downloadUrl: string | null = null;

  if (selectedFileId && files) {
    selectedFile = files.find((f) => f.id === selectedFileId) ?? null;

    if (selectedFile) {
      const { data: signed } = await supabase.storage
        .from("repo-files")
        .createSignedUrl(selectedFile.storage_path, 3600);

      if (signed?.signedUrl) {
        downloadUrl = signed.signedUrl;

        const res = await fetch(signed.signedUrl);
        const buffer = await res.arrayBuffer();
        const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
        // Only render reasonably-sized text files
        if (text.length <= 500_000) {
          fileContent = text;
        }
      }
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12 md:px-8">
      <Link
        href={"/" + profile.username}
        className="text-sm text-zinc-500 transition hover:text-white"
      >
        ← @{profile.username}
      </Link>

      {/* Repository header */}
      <div className="mt-6 border-b border-white/10 pb-8">
        <div className="flex flex-wrap items-center gap-3">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="Avatar"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C9A227]/20 text-xs font-bold text-[#E5C76B]">
              {(profile.full_name || profile.username)[0].toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-zinc-500">{profile.username} / </span>
            <span className="text-[#E5C76B]">{repository.name}</span>
          </h1>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-zinc-500">
            {repository.visibility}
          </span>
        </div>

        {repository.description && (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
            {repository.description}
          </p>
        )}

        <p className="mt-3 text-xs text-zinc-600">
          Updated {new Date(repository.updated_at).toLocaleDateString()}
        </p>
      </div>

      {/* Upload (owner only) */}
      {isOwner && (
        <div className="mt-8">
          <FileUploader repositoryId={repository.id} ownerId={repository.owner_id} />
        </div>
      )}

      {/* Files */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">
            Files ({files?.length ?? 0})
          </h2>

          {files && files.length > 0 ? (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={
                    "rounded-lg border p-3 text-sm transition " +
                    (selectedFileId === file.id
                      ? "border-[#C9A227]/60 bg-[#C9A227]/10"
                      : "border-white/10 bg-[#141414] hover:border-white/25")
                  }
                >
                  <Link
                    href={"/" + profile.username + "/" + repository.name + "?file=" + file.id}
                    className="block truncate font-mono text-xs text-zinc-200"
                  >
                    {file.file_name}
                  </Link>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600">
                      {formatSize(file.file_size)}
                    </span>
                    {isOwner && (
                      <DeleteFileButton fileId={file.id} storagePath={file.storage_path} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 bg-[#141414] p-8 text-center">
              <p className="text-sm text-zinc-500">
                No files yet.
                {isOwner
                  ? " Upload your project files above."
                  : " This repository has no files yet."}
              </p>
            </div>
          )}
        </section>

        {/* Source viewer */}
        <section>
          {selectedFile ? (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-mono text-sm text-[#E5C76B]">
                  {selectedFile.file_name}
                </h2>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={selectedFile.file_name}
                    className="rounded-lg border border-white/15 px-4 py-1.5 text-xs transition hover:border-white/40"
                  >
                    Download
                  </a>
                )}
              </div>

              {fileContent !== null ? (
                <pre className="max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-[#0d0d0d] p-5 font-mono text-xs leading-6 text-zinc-200">
                  {fileContent}
                </pre>
              ) : (
                <div className="rounded-xl border border-white/10 bg-[#141414] p-8 text-center text-sm text-zinc-500">
                  This file cannot be previewed (binary or too large).
                  {downloadUrl && (
                    <>
                      {" "}
                      <a href={downloadUrl} download={selectedFile.file_name} className="text-[#E5C76B] hover:text-white">
                        Download it instead.
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden rounded-xl border border-dashed border-white/10 bg-[#141414] p-10 text-center text-sm text-zinc-500 lg:block">
              Select a file to view its source.
            </div>
          )}
        </section>
      </div>

      <p className="mt-16 text-center text-xs text-zinc-600">
        © 2026 VectorVault. Built by Vector Codes.
      </p>
    </main>
  );
}

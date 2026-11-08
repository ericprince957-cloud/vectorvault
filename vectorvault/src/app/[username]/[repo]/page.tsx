import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import hljs from "highlight.js/lib/common";
import { createClient } from "@/lib/supabase/server";
import FileUploader from "@/components/FileUploader";
import DeleteFileButton from "@/components/DeleteFileButton";
import StarButton from "@/components/StarButton";

const MAX_PREVIEW_SIZE = 500_000;

const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  html: "xml",
  css: "css",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  sql: "sql",
  py: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  h: "c",
  cs: "csharp",
  php: "php",
  rb: "ruby",
  go: "go",
  rs: "rust",
  sh: "bash",
  bash: "bash",
  yml: "yaml",
  yaml: "yaml",
  xml: "xml",
  svg: "xml",
  toml: "toml",
};

const TEXT_EXTENSIONS = [
  "txt", "js", "jsx", "ts", "tsx", "html", "css",
  "json", "md", "mdx", "sql", "py", "java", "c",
  "cpp", "h", "cs", "php", "rb", "go", "rs",
  "sh", "bash", "yml", "yaml", "xml", "svg",
  "env", "gitignore", "dockerfile", "toml",
];

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

  // Get owner profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  // Get repository
  const { data: repository } = await supabase
    .from("repositories")
    .select("id, owner_id, name, description, visibility, updated_at")
    .eq("owner_id", profile.id)
    .eq("name", repo)
    .single();

  if (!repository) notFound();

  // Check viewer permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === repository.owner_id;

  if (repository.visibility !== "public" && !isOwner) {
    notFound();
  }

  // Get star count
  const { count: starCount } = await supabase
    .from("stars")
    .select("*", { count: "exact", head: true })
    .eq("repository_id", repository.id);

  let starredByViewer = false;

  if (user) {
    const { count: myStar } = await supabase
      .from("stars")
      .select("*", { count: "exact", head: true })
      .eq("repository_id", repository.id)
      .eq("user_id", user.id);

    starredByViewer = (myStar ?? 0) > 0;
  }

  // Get repository files
  const { data: files } = await supabase
    .from("repository_files")
    .select("id, file_name, storage_path, file_size, created_at")
    .eq("repository_id", repository.id)
    .order("created_at", { ascending: false });

  const fileList = files ?? [];

  // Selected file preview
  const selectedFile =
    fileList.find((item) => item.id === selectedFileId) ?? null;

  let fileContent: string | null = null;
  let downloadUrl: string | null = null;
  let previewError: string | null = null;
  let highlightedCode: string | null = null;
  let detectedLanguage: string | null = null;

  if (selectedFile) {
    const extension =
      selectedFile.file_name.split(".").pop()?.toLowerCase() ?? "";

    const isTextFile = TEXT_EXTENSIONS.includes(extension);

    if (!isTextFile) {
      previewError = "Preview is not available for this file type.";
    } else if (selectedFile.file_size > MAX_PREVIEW_SIZE) {
      previewError = "This file is too large to preview.";
    } else {
      const { data: signed, error: signedError } = await supabase.storage
        .from("repo-files")
        .createSignedUrl(selectedFile.storage_path, 3600);

      if (signedError) {
        previewError = signedError.message;
      } else if (signed?.signedUrl) {
        downloadUrl = signed.signedUrl;

        const { data: blob, error: downloadError } = await supabase.storage
          .from("repo-files")
          .download(selectedFile.storage_path);

        if (downloadError) {
          previewError = downloadError.message;
        } else if (blob) {
          try {
            const text = await blob.text();

            if (text.includes("\0")) {
              previewError = "This file contains binary data.";
            } else {
              fileContent = text;

              const language = LANGUAGE_MAP[extension];

              if (language && hljs.getLanguage(language)) {
                detectedLanguage = language;

                highlightedCode = hljs.highlight(text, {
                  language,
                  ignoreIllegals: true,
                }).value;
              }
            }
          } catch {
            previewError = "Unable to read this file.";
          }
        } else {
          previewError = "The file could not be downloaded.";
        }
      }
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12 md:px-8">
      <style>{`
        .hljs { color: #d4d4d8; }
        .hljs-keyword, .hljs-selector-tag { color: #c792ea; }
        .hljs-string, .hljs-attr { color: #c3e88d; }
        .hljs-number, .hljs-literal { color: #f78c6c; }
        .hljs-comment, .hljs-quote { color: #71717a; font-style: italic; }
        .hljs-title, .hljs-title.function_, .hljs-function { color: #82aaff; }
        .hljs-built_in, .hljs-type { color: #ffcb6b; }
        .hljs-variable, .hljs-template-variable { color: #f07178; }
        .hljs-params { color: #d4d4d8; }
        .hljs-property { color: #80cbc4; }
        .hljs-tag { color: #f07178; }
        .hljs-name { color: #f07178; }
        .hljs-attribute { color: #ffcb6b; }
        .hljs-meta { color: #89ddff; }
      `}</style>

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
            <span className="text-zinc-500">
              {profile.username} /{" "}
            </span>
            <span className="text-[#E5C76B]">
              {repository.name}
            </span>
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
          Updated{" "}
          {new Date(repository.updated_at).toLocaleDateString()}
        </p>

        {/* Repository actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StarButton
            repositoryId={repository.id}
            initialStarred={starredByViewer}
            initialCount={starCount ?? 0}
            isAuthed={Boolean(user)}
          />

          {fileList.length > 0 && (
            <a
              href={"/api/repos/" + repository.id + "/zip"}
              className="rounded-lg border border-white/15 px-4 py-1.5 text-xs text-zinc-300 transition hover:border-white/40"
            >
              ⬇ Download ZIP
            </a>
          )}

          {isOwner && (
            <Link
              href={"/dashboard/repositories/" + repository.id + "/settings"}
              className="rounded-lg border border-white/15 px-4 py-1.5 text-xs text-zinc-300 transition hover:border-white/40"
            >
              ⚙ Settings
            </Link>
          )}
        </div>
      </div>

      {/* Upload files */}
      {isOwner && (
        <div className="mt-8">
          <FileUploader
            repositoryId={repository.id}
            ownerId={repository.owner_id}
          />
        </div>
      )}

      {/* Repository files */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">
            Files ({fileList.length})
          </h2>

          {fileList.length > 0 ? (
            <div className="space-y-2">
              {fileList.map((file) => (
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
                    href={
                      "/" +
                      profile.username +
                      "/" +
                      repository.name +
                      "?file=" +
                      file.id
                    }
                    className="block truncate font-mono text-xs text-zinc-200"
                  >
                    {file.file_name}
                  </Link>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600">
                      {formatSize(file.file_size)}
                    </span>

                    {isOwner && (
                      <DeleteFileButton
                        fileId={file.id}
                        storagePath={file.storage_path}
                      />
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

        {/* Source code viewer */}
        <section>
          {selectedFile ? (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-mono text-sm text-[#E5C76B]">
                    {selectedFile.file_name}
                  </h2>

                  {detectedLanguage && (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
                      {detectedLanguage}
                    </p>
                  )}
                </div>

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
                <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-[#0d0d0d] p-5 font-mono text-xs leading-6">
                  {highlightedCode !== null ? (
                    <code
                      className="hljs"
                      dangerouslySetInnerHTML={{
                        __html: highlightedCode,
                      }}
                    />
                  ) : (
                    <code className="text-zinc-200">
                      {fileContent}
                    </code>
                  )}
                </pre>
              ) : (
                <div className="rounded-xl border border-white/10 bg-[#141414] p-8 text-center text-sm text-zinc-500">
                  {previewError || "This file cannot be previewed."}

                  {downloadUrl && (
                    <div className="mt-3">
                      <a
                        href={downloadUrl}
                        download={selectedFile.file_name}
                        className="text-[#E5C76B] hover:text-white"
                      >
                        Download file instead.
                      </a>
                    </div>
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
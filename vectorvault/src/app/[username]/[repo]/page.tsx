import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
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
  toml: "toml",
};

const TEXT_EXTENSIONS = [
  "txt", "js", "jsx", "ts", "tsx", "html", "css",
  "json", "md", "mdx", "sql", "py", "java", "c",
  "cpp", "h", "cs", "php", "rb", "go", "rs",
  "sh", "bash", "yml", "yaml", "xml", "env",
  "gitignore", "dockerfile", "toml", "ini", "cfg",
  "conf", "log", "csv", "tsv", "graphql", "gql",
  "prisma", "r", "swift", "kt", "dart", "vue",
  "svelte", "scss", "sass", "less", "makefile",
  "gradle", "properties", "bat", "ps1",
];

const IMAGE_EXTENSIONS = [
  "png", "jpg", "jpeg", "gif", "webp",
  "svg", "bmp", "ico", "avif",
];

const VIDEO_EXTENSIONS = ["mp4", "webm", "ogv", "mov"];

const AUDIO_EXTENSIONS = [
  "mp3", "wav", "ogg", "m4a", "aac", "flac",
];

type RepoFile = {
  id: string;
  file_name: string;
  file_path: string | null;
  storage_path: string;
  file_size: number;
  created_at: string;
};

type TreeNode = {
  name: string;
  path: string;
  file?: RepoFile;
  children: TreeNode[];
};

function getExtension(filePath: string) {
  const name = filePath.split("/").pop()?.toLowerCase() ?? "";

  if (name === "dockerfile" || name === "makefile") {
    return name;
  }

  const dot = name.lastIndexOf(".");

  return dot < 0
    ? name.startsWith(".")
      ? name.slice(1)
      : ""
    : name.slice(dot + 1);
}

function buildFileTree(files: RepoFile[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = (file.file_path || file.file_name)
      .split("/")
      .filter(Boolean);

    if (!parts.length) continue;

    let level = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath
        ? `${currentPath}/${part}`
        : part;

      let node = level.find((item) => item.name === part);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          children: [],
        };

        level.push(node);
      }

      if (index === parts.length - 1) {
        node.file = file;
      } else {
        level = node.children;
      }
    });
  }

  function sort(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      const aIsFolder = !a.file;
      const bIsFolder = !b.file;

      if (aIsFolder !== bIsFolder) {
        return aIsFolder ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

    nodes.forEach((node) => sort(node.children));
  }

  sort(root);

  return root;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  const profileUsername = profile.username;

  const { data: repository, error: repositoryError } = await supabase
    .from("repositories")
    .select("id, owner_id, name, description, visibility, updated_at")
    .eq("owner_id", profile.id)
    .eq("name", repo)
    .single();

  if (repositoryError || !repository) {
    notFound();
  }

  const repositoryName = repository.name;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.id === repository.owner_id;

  if (repository.visibility !== "public" && !isOwner) {
    notFound();
  }

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

  const { data: files, error: filesError } = await supabase
    .from("repository_files")
    .select(
      "id, file_name, file_path, storage_path, file_size, created_at"
    )
    .eq("repository_id", repository.id)
    .order("created_at", { ascending: false });

  if (filesError) {
    console.error(
      "Could not load repository files:",
      filesError.message
    );
  }

  const fileList = (files ?? []) as RepoFile[];
  const fileTree = buildFileTree(fileList);

  const selectedFile =
    fileList.find((item) => item.id === selectedFileId) ?? null;

  const selectedFilePath = selectedFile
    ? selectedFile.file_path || selectedFile.file_name
    : "";

  const extension = selectedFile
    ? getExtension(selectedFilePath)
    : "";

  const isKnownTextFile = TEXT_EXTENSIONS.includes(extension);
  let isTextFile = isKnownTextFile;

  const isImage = IMAGE_EXTENSIONS.includes(extension);
  const isVideo = VIDEO_EXTENSIONS.includes(extension);
  const isAudio = AUDIO_EXTENSIONS.includes(extension);
  const isPdf = extension === "pdf";

  let fileContent: string | null = null;
  let downloadUrl: string | null = null;
  let previewError: string | null = null;
  let highlightedCode: string | null = null;
  let detectedLanguage: string | null = null;

  if (selectedFile) {
    const { data: signed, error: signedError } =
      await supabase.storage
        .from("repo-files")
        .createSignedUrl(selectedFile.storage_path, 3600);

    if (signedError) {
      previewError = signedError.message;
    } else if (signed?.signedUrl) {
      downloadUrl = signed.signedUrl;

      const canAttemptTextDetection =
        !isImage && !isVideo && !isAudio && !isPdf;

      if (isKnownTextFile || canAttemptTextDetection) {
        if (selectedFile.file_size > MAX_PREVIEW_SIZE) {
          if (isKnownTextFile) {
            previewError = "This text file is too large to preview.";
          }
        } else {
          const { data: blob, error: downloadError } =
            await supabase.storage
              .from("repo-files")
              .download(selectedFile.storage_path);

          if (downloadError) {
            if (isKnownTextFile) {
              previewError = downloadError.message;
            }
          } else if (blob) {
            try {
              const buffer = await blob.arrayBuffer();
              const bytes = new Uint8Array(buffer);
              const hasNullByte = bytes.includes(0);

              let text: string | null = null;

              if (!hasNullByte) {
                try {
                  text = new TextDecoder("utf-8", {
                    fatal: true,
                  }).decode(buffer);
                } catch {
                  // Invalid UTF-8 usually indicates binary or another encoding.
                }
              }

              if (
                text !== null &&
                !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)
              ) {
                isTextFile = true;
                fileContent = text;

                const language = LANGUAGE_MAP[extension];

                if (language && hljs.getLanguage(language)) {
                  detectedLanguage = language;

                  highlightedCode = hljs.highlight(text, {
                    language,
                    ignoreIllegals: true,
                  }).value;
                }
              } else if (isKnownTextFile) {
                previewError =
                  "This file could not be decoded as readable text.";
              }
            } catch {
              if (isKnownTextFile) {
                previewError = "Unable to read this file.";
              }
            }
          }
        }
      }
    }
  }

  function renderTree(
    nodes: TreeNode[],
    depth = 0
  ): ReactNode {
    return nodes.map((node) => {
      const selected = node.file?.id === selectedFileId;

      if (node.file) {
        return (
          <div
            key={node.path}
            className={
              "rounded-lg border p-3 transition " +
              (selected
                ? "border-[#C9A227]/60 bg-[#C9A227]/10"
                : "border-white/10 bg-[#141414] hover:border-white/25")
            }
            style={{ marginLeft: `${depth * 12}px` }}
          >
            <Link
              href={`/${profileUsername}/${repositoryName}?file=${node.file.id}`}
              className="flex min-w-0 items-center gap-2"
            >
              <span className="shrink-0 text-sm">📄</span>

              <span className="truncate font-mono text-xs text-zinc-200">
                {node.name}
              </span>
            </Link>

            <div className="mt-2 flex items-center justify-between pl-6">
              <span className="text-[10px] text-zinc-600">
                {formatSize(node.file.file_size)}
              </span>

              {isOwner && (
                <DeleteFileButton
                  fileId={node.file.id}
                  storagePath={node.file.storage_path}
                />
              )}
            </div>
          </div>
        );
      }

      return (
        <details key={node.path} className="group">
          <summary
            className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5 hover:text-[#E5C76B]"
            style={{ marginLeft: `${depth * 12}px` }}
          >
            <span className="text-[10px] text-zinc-500 transition-transform group-open:rotate-90">
              ▶
            </span>

            <span className="group-open:hidden">📁</span>
            <span className="hidden group-open:inline">📂</span>

            <span>{node.name}</span>

            <span className="ml-auto text-[10px] text-zinc-600">
              {node.children.length}
            </span>
          </summary>

          <div className="mt-1 ml-4 space-y-2 border-l border-white/10 pl-2">
            {renderTree(node.children, depth + 1)}
          </div>
        </details>
      );
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12 md:px-8">
      <style>{`
        .hljs { color: #d4d4d8; }
        .hljs-keyword, .hljs-selector-tag { color: #c792ea; }
        .hljs-string, .hljs-attr { color: #c3e88d; }
        .hljs-number, .hljs-literal { color: #f78c6c; }
        .hljs-comment, .hljs-quote { color: #71717a; font-style: italic; }
        .hljs-title, .hljs-title.function_ { color: #82aaff; }
        .hljs-built_in, .hljs-type { color: #ffcb6b; }
        .hljs-variable, .hljs-template-variable { color: #f07178; }
        .hljs-params { color: #d4d4d8; }
        .hljs-property { color: #80cbc4; }
        .hljs-tag, .hljs-name { color: #f07178; }
        .hljs-attribute { color: #ffcb6b; }
        .hljs-meta { color: #89ddff; }
      `}</style>

      <Link
        href={`/${profile.username}`}
        className="text-sm text-zinc-500 transition hover:text-white"
      >
        ← @{profile.username}
      </Link>

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
          Updated {new Date(repository.updated_at).toLocaleDateString()}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <StarButton
            repositoryId={repository.id}
            initialStarred={starredByViewer}
            initialCount={starCount ?? 0}
            isAuthed={Boolean(user)}
          />

          {fileList.length > 0 && (
            <a
              href={`/api/repos/${repository.id}/zip`}
              className="rounded-lg border border-white/15 px-4 py-1.5 text-xs text-zinc-300 transition hover:border-white/40"
            >
              ⬇ Download ZIP
            </a>
          )}

          {isOwner && (
            <Link
              href={`/dashboard/repositories/${repository.id}/settings`}
              className="rounded-lg border border-white/15 px-4 py-1.5 text-xs text-zinc-300 transition hover:border-white/40"
            >
              ⚙ Settings
            </Link>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="mt-8">
          <FileUploader
            repositoryId={repository.id}
            ownerId={repository.owner_id}
          />
        </div>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[320px_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">
              Explorer
            </h2>

            <span className="text-[10px] text-zinc-600">
              {fileList.length} files
            </span>
          </div>

          {fileList.length > 0 ? (
            <div className="space-y-1 rounded-xl border border-white/10 bg-[#0d0d0d] p-3">
              {renderTree(fileTree)}
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

        <section className="min-w-0">
          {selectedFile ? (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="break-all font-mono text-sm text-[#E5C76B]">
                    {selectedFilePath}
                  </h2>

                  <p className="mt-1 text-[10px] text-zinc-500">
                    {formatSize(selectedFile.file_size)}
                    {detectedLanguage
                      ? ` · ${detectedLanguage}`
                      : ""}
                  </p>
                </div>

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={selectedFile.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-lg border border-white/15 px-4 py-1.5 text-xs transition hover:border-white/40"
                  >
                    Download
                  </a>
                )}
              </div>

              {!downloadUrl ? (
                <div className="rounded-xl border border-white/10 bg-[#141414] p-8 text-center text-sm text-red-400">
                  {previewError || "Unable to access this file."}
                </div>
              ) : isImage ? (
                <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d] p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={downloadUrl}
                    alt={selectedFile.file_name}
                    className="max-h-[70vh] max-w-full rounded-lg object-contain"
                  />
                </div>
              ) : isPdf ? (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#141414]">
                  <iframe
                    src={downloadUrl}
                    title={selectedFile.file_name}
                    className="h-[75vh] w-full"
                  />
                </div>
              ) : isVideo ? (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                  <video
                    controls
                    preload="metadata"
                    className="max-h-[70vh] w-full"
                  >
                    <source src={downloadUrl} />
                    Your browser does not support this video format.
                  </video>
                </div>
              ) : isAudio ? (
                <div className="rounded-xl border border-white/10 bg-[#141414] p-6">
                  <p className="mb-4 text-sm text-zinc-300">
                    Audio preview
                  </p>

                  <audio
                    controls
                    preload="metadata"
                    className="w-full"
                  >
                    <source src={downloadUrl} />
                    Your browser does not support this audio format.
                  </audio>
                </div>
              ) : isTextFile && fileContent !== null ? (
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
                <div className="rounded-xl border border-white/10 bg-[#141414] p-8 text-center">
                  <div className="mb-4 text-4xl">📦</div>

                  <h3 className="text-sm font-semibold text-zinc-200">
                    Preview unavailable
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-zinc-500">
                    This file is stored in your repository, but your
                    browser cannot display this format directly.
                    Download it to open it with a compatible application.
                  </p>

                  {previewError && (
                    <p className="mt-3 text-xs text-red-400">
                      {previewError}
                    </p>
                  )}

                  <a
                    href={downloadUrl}
                    download={selectedFile.file_name}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex rounded-lg bg-[#C9A227] px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-[#E5C76B]"
                  >
                    Download {selectedFile.file_name}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden rounded-xl border border-dashed border-white/10 bg-[#141414] p-10 text-center text-sm text-zinc-500 lg:block">
              Select a file to view its contents.
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
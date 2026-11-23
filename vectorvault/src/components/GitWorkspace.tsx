"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Branch = { id: string; name: string; is_default: boolean; head_commit_id: string | null; created_at: string };
type Commit = { id: string; branch_id: string; parent_commit_id: string | null; merge_parent_commit_id: string | null; author_id: string; message: string; created_at: string };
type FileRow = { id: string; file_path: string; file_name: string; storage_path: string; file_size: number };

export default function GitWorkspace({ repositoryId, repositoryName }: { repositoryId: string; repositoryName: string }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selected, setSelected] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [newBranch, setNewBranch] = useState("");
  const [message, setMessage] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, "source" | "target">>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (branchId?: string) => {
    const response = await fetch(`/api/repos/${repositoryId}/git${branchId ? `?branchId=${branchId}` : ""}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not load version control.");
    setBranches(data.branches ?? []);
    setCommits(data.commits ?? []);
    setFiles(data.files ?? []);
    setCanWrite(Boolean(data.canWrite));
    const next = data.selectedBranchId ?? data.branches?.[0]?.id ?? "";
    setSelected(next);
    if (!source && next) setSource(next);
    if (!target && next) setTarget(next);
  }, [repositoryId, source, target]);

  useEffect(() => { load().catch((e) => setError(e.message)); }, [load]);

  async function action(payload: Record<string, unknown>) {
    setBusy(true); setError(""); setNotice(""); setConflicts([]);
    try {
      const response = await fetch(`/api/repos/${repositoryId}/git`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.status === 409 && data.conflicts) {
        setConflicts(data.conflicts);
        setError(data.error);
        return;
      }
      if (!response.ok) throw new Error(data.error || "Action failed.");
      setNotice(payload.action === "merge" ? `Merged ${data.source} into ${data.target} (${data.mergedFiles} files).` : payload.action === "commit" ? "Commit created." : "Branch created.");
      setNewBranch(""); setMessage(""); setResolutions({});
      await load(payload.action === "create_branch" ? data.branch.id : selected);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function upload(file?: File) {
    if (!file || !selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in again to upload.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${repositoryId}/git/${selected}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("repo-files").upload(storagePath, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { error: rowError } = await supabase.from("repository_branch_files").upsert({
        branch_id: selected, file_path: safeName, file_name: safeName, storage_path: storagePath, file_size: file.size,
      }, { onConflict: "branch_id,file_path" });
      if (rowError) throw rowError;
      setNotice(`${safeName} added to this branch. Create a commit to save this snapshot.`);
      await load(selected);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(false); }
  }

  async function removeFile(file: FileRow) {
    if (!window.confirm(`Remove ${file.file_path} from this branch? Existing commits retain their snapshot.`)) return;
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("repository_branch_files").delete().eq("id", file.id);
    if (deleteError) { setError(deleteError.message); return; }
    await load(selected);
    setNotice("File removed from the branch working tree. Commit the change to record it.");
  }

  const selectedCommits = commits.filter((commit) => branches.some((b) => b.id === commit.branch_id) && (commit.branch_id === selected || commit.id === branches.find((b) => b.id === selected)?.head_commit_id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-600">Version control</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Branches & commits</h1>
          <p className="mt-2 text-sm text-zinc-400">Git-style history and three-way branch merging for {repositoryName}.</p>
        </div>
        <span className="rounded-full border border-[#C9A227]/30 px-3 py-1 text-xs text-[#E5C76B]">{branches.length} branches</span>
      </div>

      {notice && <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">{notice}</p>}
      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</p>}

      <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold">Working branch</h2><p className="mt-1 text-xs text-zinc-500">Each branch has its own file snapshot.</p></div>
          <select value={selected} onChange={(e) => { setSelected(e.target.value); load(e.target.value).catch((x) => setError(x.message)); }} className="rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-white">
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}{branch.is_default ? " · default" : ""}</option>)}
          </select>
        </div>
        {canWrite && <div className="mt-5 flex flex-wrap gap-2">
          <input value={newBranch} onChange={(e) => setNewBranch(e.target.value)} placeholder="feature/my-change" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-[#C9A227]" />
          <button disabled={busy || !newBranch.trim() || !selected} onClick={() => action({ action: "create_branch", name: newBranch, fromBranchId: selected })} className="rounded-lg border border-[#C9A227]/50 px-4 py-2 text-sm text-[#E5C76B] disabled:opacity-40">Create branch</button>
        </div>}
      </section>

      <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold">Branch files</h2><p className="mt-1 text-xs text-zinc-500">{files.length} tracked files in this working tree</p></div>
          {canWrite && <label className="cursor-pointer rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-semibold text-black hover:bg-[#E5C76B]">Add file<input type="file" className="hidden" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} /></label>}
        </div>
        <div className="mt-4 divide-y divide-white/5">
          {files.map((file) => <div key={file.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate font-mono text-xs text-zinc-200">{file.file_path}</p><p className="mt-1 text-[10px] text-zinc-600">{(file.file_size / 1024).toFixed(1)} KB</p></div>{canWrite && <button onClick={() => removeFile(file)} className="text-xs text-zinc-600 hover:text-red-300">Remove</button>}</div>)}
          {!files.length && <p className="py-6 text-center text-sm text-zinc-600">No files in this branch yet.</p>}
        </div>
        {canWrite && <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Commit message — describe what changed" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-[#C9A227]" />
          <button disabled={busy || !message.trim()} onClick={() => action({ action: "commit", branchId: selected, message })} className="rounded-lg bg-[#C9A227] px-4 py-2 text-sm font-semibold text-black disabled:opacity-40">{busy ? "Working..." : "Commit changes"}</button>
        </div>}
      </section>

      {canWrite && <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
        <h2 className="font-semibold">Merge branches</h2>
        <p className="mt-1 text-xs text-zinc-500">Merge source into target. Conflicts are detected using the common ancestor snapshot.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-zinc-500">Source branch<select value={source} onChange={(e) => setSource(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white">{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
          <label className="text-xs text-zinc-500">Target branch<select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white">{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        </div>
        {conflicts.length > 0 && <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"><p className="text-sm font-medium text-amber-200">Resolve file conflicts</p>{conflicts.map((path) => <div key={path} className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="truncate font-mono text-xs text-zinc-300">{path}</span><div className="flex gap-2"><button onClick={() => setResolutions((v) => ({ ...v, [path]: "source" }))} className={`rounded border px-2 py-1 text-[10px] ${resolutions[path] === "source" ? "border-[#C9A227] text-[#E5C76B]" : "border-white/10 text-zinc-400"}`}>Use source</button><button onClick={() => setResolutions((v) => ({ ...v, [path]: "target" }))} className={`rounded border px-2 py-1 text-[10px] ${resolutions[path] === "target" ? "border-[#C9A227] text-[#E5C76B]" : "border-white/10 text-zinc-400"}`}>Use target</button></div></div>)}<button disabled={busy || conflicts.some((p) => !resolutions[p])} onClick={() => action({ action: "merge", sourceBranchId: source, targetBranchId: target, resolutions })} className="mt-4 rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-semibold text-black disabled:opacity-40">Confirm merge resolution</button></div>}
        {conflicts.length === 0 && <button disabled={busy || !source || !target || source === target} onClick={() => action({ action: "merge", sourceBranchId: source, targetBranchId: target })} className="mt-4 rounded-lg border border-[#C9A227]/50 px-4 py-2 text-sm text-[#E5C76B] disabled:opacity-40">Merge source into target</button>}
      </section>}

      <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
        <h2 className="font-semibold">Commit history</h2>
        <div className="mt-4 space-y-3">
          {selectedCommits.map((commit) => <div key={commit.id} className="flex gap-3 border-l border-[#C9A227]/30 pl-4"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C9A227]" /><div className="min-w-0"><p className="text-sm text-zinc-200">{commit.message}</p><p className="mt-1 font-mono text-[10px] text-zinc-600">{commit.id.slice(0, 8)} · {new Date(commit.created_at).toLocaleString()}{commit.merge_parent_commit_id ? " · merge commit" : ""}</p></div></div>)}
          {!selectedCommits.length && <p className="text-sm text-zinc-600">No commits recorded on this branch yet.</p>}
        </div>
      </section>
    </div>
  );
}

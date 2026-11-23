import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRepoAccess } from "@/lib/repo-access";

type SnapshotFile = {
  file_path: string;
  file_name: string;
  storage_path: string;
  file_size: number;
};

const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

async function snapshot(supabase: any, commitId: string) {
  const { data, error } = await supabase
    .from("repository_commit_files")
    .select("file_path,file_name,storage_path,file_size")
    .eq("commit_id", commitId);
  if (error) throw error;
  return (data ?? []) as SnapshotFile[];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Sign in to view version control.", 401);

  const { data: repo } = await supabase.from("repositories")
    .select("id,owner_id,name").eq("id", id).maybeSingle();
  if (!repo) return fail("Repository not found.", 404);

  const access = await getRepoAccess(id);
  if (!access.canRead) return fail("You cannot access this repository.", 403);

  let { data: branches, error } = await supabase.from("repository_branches")
    .select("id,name,is_default,head_commit_id,created_at")
    .eq("repository_id", id).order("is_default", { ascending: false })
    .order("name");
  if (error) return fail(error.message, 500);

  if ((!branches || branches.length === 0) && access.canWrite) {
    const { data: branch, error: createError } = await supabase
      .from("repository_branches")
      .insert({ repository_id: id, name: "main", created_by: user.id, is_default: true })
      .select("id,name,is_default,head_commit_id,created_at").single();
    if (createError) return fail(createError.message, 500);

    const { data: existing } = await supabase.from("repository_files")
      .select("file_path,file_name,storage_path,file_size")
      .eq("repository_id", id);
    const files = (existing ?? []).map((file: any) => ({
      branch_id: branch.id,
      file_path: file.file_path || file.file_name,
      file_name: file.file_name,
      storage_path: file.storage_path,
      file_size: file.file_size,
    }));
    if (files.length) {
      const { error: seedError } = await supabase.from("repository_branch_files").insert(files);
      if (seedError) return fail(seedError.message, 500);
    }
    const { data: commit, error: commitError } = await supabase
      .from("repository_commits")
      .insert({ repository_id: id, branch_id: branch.id, author_id: user.id, message: "Initial commit" })
      .select("id").single();
    if (commitError) return fail(commitError.message, 500);
    if (files.length) {
      const rows = files.map((file: any) => ({
        commit_id: commit.id, file_path: file.file_path, file_name: file.file_name,
        storage_path: file.storage_path, file_size: file.file_size, change_type: "added",
      }));
      const { error: fileError } = await supabase.from("repository_commit_files").insert(rows);
      if (fileError) return fail(fileError.message, 500);
    }
    await supabase.from("repository_branches").update({ head_commit_id: commit.id }).eq("id", branch.id);
    branches = [{ ...branch, head_commit_id: commit.id }];
  }

  const requestedBranch = new URL(_request.url).searchParams.get("branchId");
  const selectedBranch = (branches ?? []).find((branch: any) => branch.id === requestedBranch)
    ?? (branches ?? []).find((branch: any) => branch.is_default)
    ?? (branches ?? [])[0];
  const { data: files } = selectedBranch
    ? await supabase.from("repository_branch_files")
        .select("id,file_path,file_name,storage_path,file_size,updated_at")
        .eq("branch_id", selectedBranch.id).order("file_path")
    : { data: [] };

  const { data: commits, error: commitsError } = await supabase
    .from("repository_commits")
    .select("id,branch_id,parent_commit_id,merge_parent_commit_id,author_id,message,created_at")
    .eq("repository_id", id).order("created_at", { ascending: false }).limit(50);
  if (commitsError) return fail(commitsError.message, 500);
  return NextResponse.json({ branches: branches ?? [], commits: commits ?? [], files: files ?? [], selectedBranchId: selectedBranch?.id ?? null, canWrite: access.canWrite });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Sign in to change branches.", 401);
  const access = await getRepoAccess(id);
  if (!access.canWrite) return fail("Write access is required.", 403);
  const { data: repo } = await supabase.from("repositories").select("id").eq("id", id).maybeSingle();
  if (!repo) return fail("Repository not found.", 404);

  let body: any;
  try { body = await request.json(); } catch { return fail("Invalid request body."); }

  if (body.action === "create_branch") {
    const name = String(body.name ?? "").trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/.test(name)) return fail("Enter a valid branch name.");
    const { data: source } = await supabase.from("repository_branches")
      .select("id,head_commit_id").eq("id", body.fromBranchId).eq("repository_id", id).single();
    if (!source) return fail("Base branch not found.", 404);
    const { data: branch, error } = await supabase.from("repository_branches")
      .insert({ repository_id: id, name, created_by: user.id, head_commit_id: source.head_commit_id, is_default: false })
      .select("id,name,is_default,head_commit_id,created_at").single();
    if (error) return fail(error.message, 409);
    const { data: files } = await supabase.from("repository_branch_files")
      .select("file_path,file_name,storage_path,file_size").eq("branch_id", source.id);
    if (files?.length) {
      const { error: copyError } = await supabase.from("repository_branch_files")
        .insert(files.map((f: SnapshotFile) => ({ ...f, branch_id: branch.id })));
      if (copyError) return fail(copyError.message, 500);
    }
    return NextResponse.json({ branch });
  }

  if (body.action === "commit") {
    const message = String(body.message ?? "").trim();
    if (!message || message.length > 500) return fail("Commit message must be between 1 and 500 characters.");
    const { data: branch } = await supabase.from("repository_branches")
      .select("id,head_commit_id").eq("id", body.branchId).eq("repository_id", id).single();
    if (!branch) return fail("Branch not found.", 404);
    const { data: files, error: filesError } = await supabase.from("repository_branch_files")
      .select("file_path,file_name,storage_path,file_size").eq("branch_id", branch.id);
    if (filesError) return fail(filesError.message, 500);
    const { data: commit, error } = await supabase.from("repository_commits")
      .insert({ repository_id: id, branch_id: branch.id, parent_commit_id: branch.head_commit_id, author_id: user.id, message })
      .select("id").single();
    if (error) return fail(error.message, 500);
    if (files?.length) {
      const rows = files.map((f: SnapshotFile) => ({
        commit_id: commit.id, ...f, change_type: "modified",
      }));
      const { error: snapshotError } = await supabase.from("repository_commit_files").insert(rows);
      if (snapshotError) return fail(snapshotError.message, 500);
    }
    const { error: updateError } = await supabase.from("repository_branches")
      .update({ head_commit_id: commit.id }).eq("id", branch.id);
    if (updateError) return fail(updateError.message, 500);
    return NextResponse.json({ commit });
  }

  if (body.action === "merge") {
    const { data: source } = await supabase.from("repository_branches")
      .select("id,name,head_commit_id").eq("id", body.sourceBranchId).eq("repository_id", id).single();
    const { data: target } = await supabase.from("repository_branches")
      .select("id,name,head_commit_id").eq("id", body.targetBranchId).eq("repository_id", id).single();
    if (!source || !target) return fail("Select valid source and target branches.");
    if (source.id === target.id) return fail("Choose two different branches.");

    const ancestors = async (head: string | null) => {
      const seen = new Set<string>();
      const queue = head ? [head] : [];
      while (queue.length && seen.size < 500) {
        const current = queue.shift()!;
        if (seen.has(current)) continue;
        seen.add(current);
        const { data } = await supabase.from("repository_commits")
          .select("parent_commit_id,merge_parent_commit_id").eq("id", current).maybeSingle();
        if (data?.parent_commit_id) queue.push(data.parent_commit_id);
        if (data?.merge_parent_commit_id) queue.push(data.merge_parent_commit_id);
      }
      return seen;
    };
    const sourceAncestors = await ancestors(source.head_commit_id);
    const targetAncestors = await ancestors(target.head_commit_id);
    const baseId = [...sourceAncestors].find((value) => targetAncestors.has(value)) ?? null;
    const [baseFiles, sourceFiles, targetFiles] = await Promise.all([
      baseId ? snapshot(supabase, baseId) : Promise.resolve([] as SnapshotFile[]),
      source.head_commit_id ? snapshot(supabase, source.head_commit_id) : Promise.resolve([] as SnapshotFile[]),
      target.head_commit_id ? snapshot(supabase, target.head_commit_id) : Promise.resolve([] as SnapshotFile[]),
    ]);
    const byPath = (items: SnapshotFile[]) => new Map(items.map((f) => [f.file_path, f]));
    const base = byPath(baseFiles), src = byPath(sourceFiles), dst = byPath(targetFiles);
    const paths = new Set([...base.keys(), ...src.keys(), ...dst.keys()]);
    const resolutions = body.resolutions ?? {};
    const merged: SnapshotFile[] = [];
    const conflicts: string[] = [];
    for (const path of paths) {
      const b = base.get(path), s = src.get(path), t = dst.get(path);
      const same = (a?: SnapshotFile, c?: SnapshotFile) => a?.storage_path === c?.storage_path;
      const sourceChanged = !same(s, b), targetChanged = !same(t, b);
      let chosen: SnapshotFile | undefined;
      if (!sourceChanged) chosen = t;
      else if (!targetChanged || same(s, t)) chosen = s;
      else if (resolutions[path] === "source") chosen = s;
      else if (resolutions[path] === "target") chosen = t;
      else conflicts.push(path);
      if (chosen) merged.push(chosen);
    }
    if (conflicts.length) return NextResponse.json({ error: "Merge conflicts need a resolution.", conflicts }, { status: 409 });

    const message = String(body.message ?? `Merge ${source.name} into ${target.name}`).slice(0, 500);
    const { data: commit, error: commitError } = await supabase.from("repository_commits")
      .insert({ repository_id: id, branch_id: target.id, parent_commit_id: target.head_commit_id,
        merge_parent_commit_id: source.head_commit_id, author_id: user.id, message })
      .select("id").single();
    if (commitError) return fail(commitError.message, 500);
    if (merged.length) {
      const { error: snapError } = await supabase.from("repository_commit_files").insert(
        merged.map((f) => ({ commit_id: commit.id, ...f, change_type: "modified" }))
      );
      if (snapError) return fail(snapError.message, 500);
    }
    await supabase.from("repository_branch_files").delete().eq("branch_id", target.id);
    if (merged.length) {
      const { error: filesError } = await supabase.from("repository_branch_files")
        .insert(merged.map((f) => ({ ...f, branch_id: target.id })));
      if (filesError) return fail(filesError.message, 500);
    }
    const { error: headError } = await supabase.from("repository_branches")
      .update({ head_commit_id: commit.id }).eq("id", target.id);
    if (headError) return fail(headError.message, 500);
    return NextResponse.json({ commit, mergedFiles: merged.length, source: source.name, target: target.name });
  }
  return fail("Unknown version-control action.");
}

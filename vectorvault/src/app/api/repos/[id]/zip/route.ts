import { NextResponse } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: repo } = await supabase
    .from("repositories")
    .select("id, name, visibility, owner_id")
    .eq("id", id)
    .single();

  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  // Private repos: only the owner may download.
  if (repo.visibility !== "public" && repo.owner_id !== user?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: files } = await supabase
    .from("repository_files")
    .select("file_name, storage_path")
    .eq("repository_id", id);

  if (!files || files.length === 0) {
    return NextResponse.json(
      { error: "This repository has no files" },
      { status: 404 }
    );
  }

  const zip = new JSZip();

  for (const file of files) {
    const { data: signed } = await supabase.storage
      .from("repo-files")
      .createSignedUrl(file.storage_path, 60);

    if (!signed?.signedUrl) continue;

    const res = await fetch(signed.signedUrl);
    const buffer = await res.arrayBuffer();
    zip.file(file.file_name, buffer);
  }

  const content = await zip.generateAsync({ type: "uint8array" });

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition":
        'attachment; filename="' + repo.name + '.zip"',
    },
  });
}

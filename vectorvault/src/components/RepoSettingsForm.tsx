"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type RepoSettings = {
  id: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  ownerUsername: string;
};

export default function RepoSettingsForm({ repo }: { repo: RepoSettings }) {
  const router = useRouter();
  const [name, setName] = useState(repo.name);
  const [description, setDescription] = useState(repo.description || "");
  const [visibility, setVisibility] = useState<"public" | "private">repo.visibility);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const cleanName = name.trim().replace(/\s+/g, "-").toLowerCase();
    if (!/^[a-z0-9-_]+$/.test(cleanName)) {
      setError("Name can only contain letters, numbers, - and _.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("repositories")
      .update({
        name: cleanName,
        description: description.trim() || null,
        visibility,
        updated_at: new Date().toISOString(),
      })
      .eq("id", repo.id);

    if (updateError) {
      setError(updateError.code === "23505" ? "You already have a repository with that name." : updateError.message);
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
    if (cleanName !== repo.name) {
      router.push("/dashboard/repositories");
    }
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        "Delete this repository and all its files? This cannot be undone."
      )
    )
      return;

    setDeleting(true);

    const supabase = createClient();

    // Remove files from storage
    const { data: files } = await supabase
      .from("repository_files")
      .select("storage_path")
      .eq("repository_id", repo.id);

    if (files && files.length > 0) {
      await supabase.storage
        .from("repo-files")
        .remove(files.map((f) => f.storage_path));
    }

    await supabase.from("repositories").delete().eq("id", repo.id);

    router.push("/dashboard/repositories");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-2xl border border-white/10 bg-[#141414] p-8"
      >
        <div>
          <label htmlFor="name" className="mb-1.5 block text-xs text-zinc-400">
            Repository name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-xs text-zinc-400">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description of your project"
            className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
          />
        </div>

        <div>
          <p className="mb-2 text-xs text-zinc-400">Visibility</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["public", "private"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setVisibility(option)}
                className={
                  "rounded-lg border p-4 text-left transition " +
                  (visibility === option
                    ? "border-[#C9A227] bg-[#C9A227]/10"
                    : "border-white/10 hover:border-white/30")
                }
              >
                <p className="text-sm font-medium capitalize">{option}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {option === "public"
                    ? "Anyone on VectorVault can see this repository."
                    : "Only you can see this repository."}
                </p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/10 px-4 py-3 text-xs text-[#E5C76B]">
            Repository saved.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
        <h2 className="text-lg font-semibold text-red-400">Danger zone</h2>
        <p className="mt-2 text-xs text-zinc-500">
          Deleting a repository removes all of its files permanently.
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="mt-5 rounded-lg border border-red-500/40 px-6 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete this repository"}
        </button>
      </div>
    </div>
  );
}

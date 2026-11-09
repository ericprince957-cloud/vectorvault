
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

export default function RepoSettingsForm({
  repo,
}: {
  repo: RepoSettings;
}) {
  const router = useRouter();

  const [name, setName] = useState(repo.name);
  const [description, setDescription] = useState(repo.description || "");
  const [visibility, setVisibility] = useState<"public" | "private">(
    repo.visibility
  );

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSaved(false);

    const cleanName = name.trim().replace(/\s+/g, "-").toLowerCase();

    if (!/^[a-z0-9_-]+$/.test(cleanName)) {
      setError("Name can only contain letters, numbers, hyphens and underscores.");
      setLoading(false);
      return;
    }

    if (cleanName.length > 100) {
      setError("Repository name cannot exceed 100 characters.");
      setLoading(false);
      return;
    }

    if (description.trim().length > 500) {
      setError("Description cannot exceed 500 characters.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: updateError } = await supabase
        .from("repositories")
        .update({
          name: cleanName,
          description: description.trim() || null,
          visibility,
          updated_at: new Date().toISOString(),
        })
        .eq("id", repo.id)
        .select("id")
        .single();

      if (updateError || !data) {
        setError(
          updateError?.code === "23505"
            ? "You already have a repository with that name."
            : updateError?.message || "Repository could not be updated."
        );
        return;
      }

      setSaved(true);

      if (cleanName !== repo.name) {
        router.push("/dashboard/repositories");
      }

      router.refresh();
    } catch {
      setError("Something went wrong while saving your repository.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete this repository and all its files? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get every storage path belonging to this repository.
      const { data: files, error: filesError } = await supabase
        .from("repository_files")
        .select("storage_path")
        .eq("repository_id", repo.id);

      if (filesError) {
        setError("Could not retrieve repository files: " + filesError.message);
        return;
      }

      // Remove uploaded files from Supabase Storage.
      const storagePaths = (files || [])
        .map((file) => file.storage_path)
        .filter((path): path is string => Boolean(path));

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("repo-files")
          .remove(storagePaths);

        if (storageError) {
          setError("Could not remove repository files: " + storageError.message);
          return;
        }
      }

      // Delete the repository itself.
      const { data, error: deleteError } = await supabase
        .from("repositories")
        .delete()
        .eq("id", repo.id)
        .select("id")
        .single();

      if (deleteError || !data) {
        setError(
          deleteError?.message || "Repository could not be deleted."
        );
        return;
      }

      router.push("/dashboard/repositories");
      router.refresh();
    } catch {
      setError("Something went wrong while deleting the repository.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-2xl border border-white/10 bg-[#141414] p-8"
      >
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-xs text-zinc-400"
          >
            Repository name
          </label>

          <input
            id="name"
            type="text"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-xs text-zinc-400"
          >
            Description
          </label>

          <input
            id="description"
            type="text"
            maxLength={500}
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
                aria-pressed={visibility === option}
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
            Repository saved successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || deleting}
          className="rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
        <h2 className="text-lg font-semibold text-red-400">Danger zone</h2>

        <p className="mt-2 text-xs text-zinc-500">
          Deleting a repository removes its uploaded files and repository
          records permanently.
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || loading}
          className="mt-5 rounded-lg border border-red-500/40 px-6 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete this repository"}
        </button>
      </div>
    </div>
  );
}

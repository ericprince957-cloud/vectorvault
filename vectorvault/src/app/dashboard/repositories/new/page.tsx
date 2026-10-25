"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewRepositoryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in to create a repository.");
      setLoading(false);
      return;
    }

    const cleanName = name.trim().replace(/\s+/g, "-").toLowerCase();
    if (!/^[a-z0-9-_]+$/.test(cleanName)) {
      setError("Repository name can only contain letters, numbers, - and _.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("repositories").insert({
      owner_id: user.id,
      name: cleanName,
      description: description.trim() || null,
      visibility,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("You already have a repository with that name.");
      } else {
        setError(insertError.message);
      }
      setLoading(false);
      return;
    }

    router.push("/dashboard/repositories");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Create repository</h1>
      <p className="mt-2 text-sm text-zinc-400">
        A repository contains your project files and their descriptions.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-[#141414] p-8"
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
            placeholder="my-awesome-project"
            className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-xs text-zinc-400">
            Description (optional)
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

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create repository"}
        </button>
      </form>
    </div>
  );
}

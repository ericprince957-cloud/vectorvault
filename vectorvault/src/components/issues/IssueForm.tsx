"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TopicField from "@/components/TopicField";
import { ISSUE_PRIORITIES, type IssuePriority } from "@/types/database";
import { normalizeLabels } from "@/lib/topics";

export default function IssueForm({
  repositoryId,
  redirectTo,
}: {
  repositoryId: string;
  redirectTo: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("normal");
  const [labels, setLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanTitle = title.trim();

    if (cleanTitle.length < 3) {
      setError("Issue titles need at least 3 characters.");
      setLoading(false);
      return;
    }

    if (cleanTitle.length > 200) {
      setError("Issue titles cannot exceed 200 characters.");
      setLoading(false);
      return;
    }

    if (body.trim().length > 20000) {
      setError("Issue descriptions cannot exceed 20000 characters.");
      setLoading(false);
      return;
    }

    const { tags: cleanLabels, error: labelsError } =
      normalizeLabels(labels);

    if (labelsError) {
      setError(labelsError);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in to create an issue.");
      setLoading(false);
      return;
    }

    // RLS ensures only authenticated users with access to this
    // repository (public, or an accepted collaborator) can
    // insert; author_id must be the caller.
    const { data, error: insertError } = await supabase
      .from("issues")
      .insert({
        repository_id: repositoryId,
        author_id: user.id,
        title: cleanTitle,
        body: body.trim() || null,
        priority,
        labels: cleanLabels,
        status: "open",
      })
      .select("id")
      .single();

    if (insertError || !data) {
      setError(insertError?.message || "The issue could not be created.");
      setLoading(false);
      return;
    }

    router.push(`${redirectTo}/issues/${data.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-[#141414] p-8"
    >
      <div>
        <label htmlFor="title" className="mb-1.5 block text-xs text-zinc-400">
          Title
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Something needs attention"
          className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
        />
      </div>

      <div>
        <label htmlFor="body" className="mb-1.5 block text-xs text-zinc-400">
          Description (optional)
        </label>
        <textarea
          id="body"
          rows={8}
          maxLength={20000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe the issue, steps to reproduce it, or the task to complete."
          className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#C9A227]/60"
        />
      </div>

      <div>
        <label
          htmlFor="priority"
          className="mb-1.5 block text-xs text-zinc-400"
        >
          Priority
        </label>
        <select
          id="priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as IssuePriority)}
          className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60 sm:w-56"
        >
          {ISSUE_PRIORITIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <TopicField
        topics={labels}
        onChange={setLabels}
        label="Labels"
        hint="Up to 8 labels. Separate with commas, spaces or Enter."
        placeholder="bug, frontend, urgent-fix"
      />

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create issue"}
        </button>
        <button
          type="button"
          onClick={() => router.push(redirectTo + "/issues")}
          className="rounded-lg border border-white/15 px-6 py-3 text-sm transition hover:border-white/40"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

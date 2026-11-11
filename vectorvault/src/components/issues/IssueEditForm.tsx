"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizeLabels } from "@/lib/topics";
import { ISSUE_PRIORITIES } from "@/types/database";

// Inline editor for an issue's title, description, priority and
// labels. Only rendered for the issue author, repository owner or
// an admin collaborator; RLS enforces the same rule on update.

export default function IssueEditForm({
  issueId,
  initialTitle,
  initialBody,
  initialPriority,
  initialLabels,
  onClose,
}: {
  issueId: string;
  initialTitle: string;
  initialBody: string;
  initialPriority: string;
  initialLabels: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [priority, setPriority] = useState(initialPriority);
  const [labelsInput, setLabelsInput] = useState(initialLabels.join(", "));
  const [labels, setLabels] = useState<string[]>(initialLabels);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { tags: cleanLabels, error: labelsError } = normalizeLabels(labels);
      if (labelsError) {
        setError(labelsError);
        return;
      }

      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("issues")
        .update({
          title: title.trim(),
          body,
          priority,
          labels: cleanLabels,
        })
        .eq("id", issueId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#C9A227]/30 bg-[#141414] p-4">
      <label className="mb-1 block text-xs text-zinc-400">Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-3 w-full rounded-lg border border-zinc-800 bg-[#090909] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A227]/60"
        maxLength={150}
      />

      <label className="mb-1 block text-xs text-zinc-400">Description</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        className="mb-3 w-full rounded-lg border border-zinc-800 bg-[#090909] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A227]/60"
        placeholder="Describe the issue..."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-zinc-400">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-[#090909] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A227]/60"
          >
            {ISSUE_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-400">Labels</label>
          <input
            value={labelsInput}
            onChange={(e) => {
              setLabelsInput(e.target.value);
              setLabels(normalizeLabels(e.target.value.split(",")).tags);
            }}
            placeholder="bug, frontend"
            className="w-full rounded-lg border border-zinc-800 bg-[#090909] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A227]/60"
          />
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[#C9A227] px-4 py-2 text-xs font-medium text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg border border-zinc-800 px-4 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800/40 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, type KeyboardEvent } from "react";
import { MAX_TAGS } from "@/lib/topics";

// Chip-style input for repository topics and issue labels.
// The parent owns the value; this component only normalizes
// keystrokes into chips.

export default function TopicField({
  topics,
  onChange,
  label = "Topics",
  hint = `Up to ${MAX_TAGS} topics. Separate with commas, spaces or Enter.`,
  placeholder = "react, nextjs, supabase",
}: {
  topics: string[];
  onChange: (topics: string[]) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    if (!draft.trim()) return;

    const parts = draft
      .split(/[\s,]+/)
      .map((part) => part.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);

    const merged: string[] = [];
    for (const tag of [...topics, ...parts]) {
      if (!merged.includes(tag)) {
        merged.push(tag);
      }
    }

    onChange(merged.slice(0, MAX_TAGS));
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    }
  }

  function removeTopic(topic: string) {
    onChange(topics.filter((item) => item !== topic));
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs text-zinc-400">
        {label}
      </label>

      <div className="rounded-lg border border-white/10 bg-[#090909] px-3 py-2 transition focus-within:border-[#C9A227]/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {topics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center gap-1 rounded-full bg-[#C9A227]/15 px-2 py-0.5 text-xs text-[#E5C76B]"
            >
              {topic}
              <button
                type="button"
                onClick={() => removeTopic(topic)}
                aria-label={`Remove ${topic}`}
                className="text-zinc-400 transition hover:text-white"
              >
                ×
              </button>
            </span>
          ))}

          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitDraft}
            placeholder={topics.length === 0 ? placeholder : ""}
            aria-label={`Add ${label.toLowerCase()}`}
            className="min-w-40 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-zinc-600"
          />
        </div>
      </div>

      <p className="mt-1.5 text-[11px] text-zinc-600">{hint}</p>
    </div>
  );
}

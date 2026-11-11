"use client";

import { useState } from "react";
import IssueEditForm from "./IssueEditForm";

// Client wrapper that toggles the inline issue editor. `canEdit`
// mirrors the RLS update policy (issue author, repository owner
// or admin collaborator).

export default function IssueEditor({
  issueId,
  title,
  body,
  priority,
  labels,
  canEdit,
}: {
  issueId: string;
  title: string;
  body: string;
  priority: string;
  labels: string[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (!canEdit) {
    return null;
  }

  if (editing) {
    return (
      <IssueEditForm
        issueId={issueId}
        initialTitle={title}
        initialBody={body}
        initialPriority={priority}
        initialLabels={labels}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="rounded-lg border border-zinc-800 px-4 py-2 text-xs text-zinc-300 transition hover:bg-zinc-800/40"
    >
      Edit
    </button>
  );
}

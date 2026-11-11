"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CollaboratorRole } from "@/types/database";

export type CollaboratorView = {
  id: string;
  user_id: string;
  username: string;
  full_name: string | null;
  role: CollaboratorRole;
  status: "pending" | "accepted" | "declined";
  invited_by_username: string | null;
  created_at: string;
};

type SearchResult = {
  id: string;
  username: string;
  full_name: string | null;
};

const ROLE_ORDER: CollaboratorRole[] = ["read", "write", "admin"];

const ROLE_DESCRIPTIONS: Record<CollaboratorRole, string> = {
  read: "View and download repository content. Cannot upload, edit or delete.",
  write: "Everything in read, plus upload files, create folders and edit content.",
  admin: "Everything in write, plus manage collaborators and repository settings.",
};

export default function CollaboratorsPanel({
  repositoryId,
  ownerUsername,
  ownerUserId,
  canManage,
  collaborators,
}: {
  repositoryId: string;
  ownerUsername: string;
  ownerUserId: string;
  canManage: boolean;
  collaborators: CollaboratorView[];
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>("read");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const pending = collaborators.filter((c) => c.status === "pending");
  const accepted = collaborators.filter((c) => c.status === "accepted");
  const declined = collaborators.filter((c) => c.status === "declined");

  async function handleSearch() {
    const term = search.trim().toLowerCase();
    setError(null);
    setNotice(null);

    if (!term) {
      setResults(null);
      return;
    }

    setBusy(true);

    try {
      const supabase = createClient();
      const { data, error: searchError } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .ilike("username", `%${term}%`)
        .limit(5);

      if (searchError) {
        setError(searchError.message);
        return;
      }

      setResults((data ?? []) as SearchResult[]);
    } finally {
      setBusy(false);
    }
  }

  async function inviteUser(target: SearchResult) {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be signed in.");
        return;
      }

      if (target.id === ownerUserId || target.username === ownerUsername) {
        setError("That developer already owns this repository.");
        return;
      }

      const existing = collaborators.find((c) => c.user_id === target.id);
      if (existing && existing.status !== "declined") {
        setError(`@${target.username} already has an invitation or membership.`);
        return;
      }

      const payload = {
        repository_id: repositoryId,
        user_id: target.id,
        role: inviteRole,
        invited_by: user.id,
        status: "pending",
      };

      const { error: insertError } = await supabase
        .from("repository_collaborators")
        .insert(payload);

      if (insertError) {
        if (insertError.code === "23505") {
          // A declined invitation exists — re-invite it instead.
          const { error: updateError } = await supabase
            .from("repository_collaborators")
            .update({
              role: inviteRole,
              invited_by: user.id,
              status: "pending",
              updated_at: new Date().toISOString(),
            })
            .eq("repository_id", repositoryId)
            .eq("user_id", target.id);

          if (updateError) {
            setError(updateError.message);
            return;
          }
        } else {
          setError(insertError.message);
          return;
        }
      }

      setNotice(`Invitation sent to @${target.username}.`);
      setSearch("");
      setResults(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(row: CollaboratorView, role: CollaboratorRole) {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("repository_collaborators")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", row.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setNotice(`@${row.username} is now ${role}.`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function respond(row: CollaboratorView, status: "pending") {
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("repository_collaborators")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", row.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: CollaboratorView) {
    if (
      !window.confirm(
        `Remove @${row.username} from this repository? They lose access immediately.`
      )
    ) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("repository_collaborators")
        .delete()
        .eq("id", row.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {canManage && (
        <section className="rounded-2xl border border-white/10 bg-[#141414] p-6">
          <h2 className="text-sm font-semibold">Invite a collaborator</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Search developers by username, then send an invitation.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="username"
              aria-label="Search developers by username"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#090909] px-4 py-2.5 text-sm outline-none transition focus:border-[#C9A227]/60"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
              aria-label="Invitation role"
              className="rounded-lg border border-white/10 bg-[#090909] px-3 py-2.5 text-sm outline-none transition focus:border-[#C9A227]/60"
            >
              {ROLE_ORDER.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSearch}
              disabled={busy}
              className="rounded-lg bg-[#C9A227] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {results && (
            <div className="mt-4 space-y-2">
              {results.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No developers found. Usernames are lowercase.
                </p>
              ) : (
                results.map((result) => (
                  <div
                    key={result.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/${result.username}`}
                        className="text-sm font-medium text-[#E5C76B] hover:text-white"
                      >
                        @{result.username}
                      </Link>
                      {result.full_name && (
                        <span className="ml-2 text-xs text-zinc-500">
                          {result.full_name}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => inviteUser(result)}
                      disabled={busy}
                      className="rounded-lg border border-[#C9A227]/40 px-4 py-1.5 text-xs text-[#E5C76B] transition hover:bg-[#C9A227]/10 disabled:opacity-50"
                    >
                      Invite as {inviteRole}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      )}

      {(error || notice) && (
        <p
          className={
            "rounded-lg border px-4 py-3 text-xs " +
            (error
              ? "border-red-500/30 bg-red-500/10 text-red-400"
              : "border-[#C9A227]/30 bg-[#C9A227]/10 text-[#E5C76B]")
          }
        >
          {error || notice}
        </p>
      )}

      {/* Pending invitations */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          Pending invitations ({pending.length})
        </h2>

        {pending.length > 0 ? (
          <div className="space-y-2">
            {pending.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141414] px-5 py-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/${row.username}`}
                    className="text-sm font-medium text-[#E5C76B] hover:text-white"
                  >
                    @{row.username}
                  </Link>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Invited {new Date(row.created_at).toLocaleDateString()}
                    {row.invited_by_username
                      ? ` by @${row.invited_by_username}`
                      : ""}
                  </p>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2">
                    <select
                      value={row.role}
                      onChange={(e) =>
                        changeRole(row, e.target.value as CollaboratorRole)
                      }
                      disabled={busy}
                      aria-label={`Role for @${row.username}`}
                      className="rounded-lg border border-white/10 bg-[#090909] px-3 py-1.5 text-xs outline-none focus:border-[#C9A227]/60"
                    >
                      {ROLE_ORDER.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      disabled={busy}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </div>
                )}

                {!canManage && (
                  <span className="text-xs text-zinc-500">{row.role}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/15 bg-[#141414] px-5 py-6 text-xs text-zinc-500">
            No pending invitations.
          </p>
        )}
      </section>

      {/* Accepted collaborators */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          Collaborators ({accepted.length})
        </h2>

        {accepted.length > 0 ? (
          <div className="space-y-2">
            {accepted.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141414] px-5 py-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/${row.username}`}
                    className="text-sm font-medium text-[#E5C76B] hover:text-white"
                  >
                    @{row.username}
                  </Link>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {ROLE_DESCRIPTIONS[row.role]}
                  </p>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2">
                    <select
                      value={row.role}
                      onChange={(e) =>
                        changeRole(row, e.target.value as CollaboratorRole)
                      }
                      disabled={busy}
                      aria-label={`Role for @${row.username}`}
                      className="rounded-lg border border-white/10 bg-[#090909] px-3 py-1.5 text-xs outline-none focus:border-[#C9A227]/60"
                    >
                      {ROLE_ORDER.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      disabled={busy}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {!canManage && (
                  <span className="text-xs text-zinc-500">{row.role}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/15 bg-[#141414] px-5 py-6 text-xs text-zinc-500">
            No accepted collaborators yet. @{ownerUsername} keeps full control
            either way.
          </p>
        )}
      </section>

      {/* Declined invitations */}
      {declined.length > 0 && canManage && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-300">
            Declined invitations ({declined.length})
          </h2>
          <div className="space-y-2">
            {declined.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141414] px-5 py-4"
              >
                <span className="text-sm text-zinc-400">@{row.username}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => respond(row, "pending")}
                    disabled={busy}
                    className="rounded-lg border border-[#C9A227]/40 px-3 py-1.5 text-xs text-[#E5C76B] transition hover:bg-[#C9A227]/10 disabled:opacity-50"
                  >
                    Re-invite
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    disabled={busy}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-400 transition hover:border-white/40 disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface NotificationView {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  actor_username: string | null;
  actor_avatar: string | null;
}

const TYPE_ICONS: Record<string, string> = {
  follow: "👤",
  star: "⭐",
  repository_invitation: "🤝",
  issue_assigned: "📋",
  issue_comment: "💬",
  mention: "@",
  system: "🔧",
};

function timeAgo(iso: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Interactive notification list. All mutations go through the
// browser client; RLS only permits acting on notifications where
// recipient_id = auth.uid().

export default function NotificationList({
  notifications,
}: {
  notifications: NotificationView[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markRead(id: string) {
    if (busy) return;
    setBusy(id);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id)
        .is("read_at", null);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function markAllRead() {
    if (busy) return;
    setBusy("all");
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (busy) return;
    setBusy(id);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {notifications.length} notification
          {notifications.length === 1 ? "" : "s"}
        </p>
        {hasUnread && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={busy !== null}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-800/40 disabled:opacity-50"
          >
            {busy === "all" ? "Marking..." : "Mark all as read"}
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-[#141414] p-8 text-center">
          <p className="text-sm text-zinc-400">You're all caught up 🎉</p>
          <p className="mt-1 text-xs text-zinc-600">
            Notifications about stars, followers, invitations and issue activity
            will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const icon = TYPE_ICONS[n.type] ?? "🔔";
            const unread = !n.read_at;

            const content = (
              <div
                className={`flex items-start gap-3 rounded-lg border p-4 transition ${
                  unread
                    ? "border-[#C9A227]/30 bg-[#C9A227]/5"
                    : "border-zinc-800 bg-[#141414]"
                } ${n.link ? "hover:border-[#C9A227]/50" : ""}`}
              >
                <span className="mt-0.5 text-lg leading-none">{icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {n.title}
                    {unread && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-[#C9A227] align-middle" />
                    )}
                  </p>
                  {n.body && (
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-zinc-600">
                    {n.actor_username && (
                      <>
                        <span className="text-[#E5C76B]">
                          @{n.actor_username}
                        </span>
                        <span>·</span>
                      </>
                    )}
                    <span>{timeAgo(n.created_at)}</span>
                  </p>
                </div>
              </div>
            );

            return (
              <li key={n.id} className="group relative">
                {n.link ? (
                  <Link
                    href={n.link}
                    onClick={() => unread && markRead(n.id)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}

                <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
                  {unread && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      disabled={busy === n.id}
                      title="Mark as read"
                      className="rounded-md border border-zinc-800 bg-[#090909] px-2 py-1 text-[10px] text-zinc-400 transition hover:text-[#E5C76B] disabled:opacity-50"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(n.id)}
                    disabled={busy === n.id}
                    title="Delete notification"
                    className="rounded-md border border-zinc-800 bg-[#090909] px-2 py-1 text-[10px] text-zinc-400 transition hover:text-red-400 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

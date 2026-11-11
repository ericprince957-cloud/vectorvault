"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Bell icon with live unread badge shown in the dashboard sidebar.
// The count is fetched with the browser client, so RLS guarantees
// a user only ever sees their own unread total.

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const supabase = createClient();
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .is("read_at", null);

        if (active) {
          setUnread(count ?? 0);
        }
      } catch {
        // Signed out or offline — keep the last known value.
      }
    }

    refresh();
    const interval = setInterval(refresh, 60000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Link
      href="/dashboard/notifications"
      title="Notifications"
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-[#E5C76B]"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>

      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C9A227] px-1 text-[10px] font-bold text-black">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}

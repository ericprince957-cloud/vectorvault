"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function StarButton({
  repositoryId,
  initialStarred,
  initialCount,
  isAuthed,
}: {
  repositoryId: string;
  initialStarred: boolean;
  initialCount: number;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [starred, setStarred] = useState(initialStarred);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggleStar() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    if (loading) return;
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (starred) {
      await supabase
        .from("stars")
        .delete()
        .eq("user_id", user.id)
        .eq("repository_id", repositoryId);
      setStarred(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("stars").insert({
        user_id: user.id,
        repository_id: repositoryId,
      });
      setStarred(true);
      setCount((c) => c + 1);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggleStar}
      disabled={loading}
      className={
        "rounded-lg px-4 py-1.5 text-xs font-semibold transition " +
        (starred
          ? "bg-[#C9A227] text-black hover:bg-[#E5C76B]"
          : "border border-white/15 text-zinc-300 hover:border-white/40")
      }
    >
      {starred ? "★ Starred" : "☆ Star"} ({count})
    </button>
  );
}

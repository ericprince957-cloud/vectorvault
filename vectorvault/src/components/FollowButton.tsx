"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FollowButton({
  profileId,
  initialFollowing,
  initialCount,
  isAuthed,
  isSelf,
}: {
  profileId: string;
  initialFollowing: boolean;
  initialCount: number;
  isAuthed: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  if (isSelf) {
    return (
      <span className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-zinc-600">
        This is you
      </span>
    );
  }

  async function toggleFollow() {
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

    if (following) {
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", profileId);
      setFollowing(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("followers").insert({
        follower_id: user.id,
        following_id: profileId,
      });
      setFollowing(true);
      setCount((c) => c + 1);
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={loading}
      className={
        "rounded-lg px-4 py-1.5 text-xs font-semibold transition " +
        (following
          ? "bg-[#C9A227] text-black hover:bg-[#E5C76B]"
          : "border border-white/15 text-zinc-300 hover:border-white/40")
      }
    >
      {following ? "Following" : "+ Follow"} ({count})
    </button>
  );
}

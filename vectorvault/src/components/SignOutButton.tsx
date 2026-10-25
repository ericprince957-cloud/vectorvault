"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="w-full rounded-lg border border-white/10 px-4 py-2 text-left text-sm text-zinc-400 transition hover:border-white/30 hover:text-white"
    >
      Sign out
    </button>
  );
}

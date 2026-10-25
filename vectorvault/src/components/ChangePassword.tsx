"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setPassword("");
      setConfirm("");
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-white/10 bg-[#141414] p-8"
    >
      <div>
        <h2 className="text-lg font-semibold">Change password</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Use at least 8 characters. You will stay signed in.
        </p>
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1.5 block text-xs text-zinc-400">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-xs text-zinc-400">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/10 px-4 py-3 text-xs text-[#E5C76B]">
          Password updated.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
      >
        {loading ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

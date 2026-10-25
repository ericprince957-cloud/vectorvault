"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type ProfileData = {
  username: string;
  full_name: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  github_url: string | null;
  skills: string[] | null;
};

export default function ProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [location, setLocation] = useState(profile.location || "");
  const [githubUrl, setGithubUrl] = useState(profile.github_url || "");
  const [skills, setSkills] = useState((profile.skills || []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in.");
      setLoading(false);
      return;
    }

    const skillsArray = skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        website: website.trim() || null,
        location: location.trim() || null,
        github_url: githubUrl.trim() || null,
        skills: skillsArray,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
    router.refresh();
  }

  const fields = [
    { id: "fullName", label: "Full name", value: fullName, set: setFullName, placeholder: "Prince Eric" },
    { id: "location", label: "Location", value: location, set: setLocation, placeholder: "Lagos, Nigeria" },
    { id: "website", label: "Website", value: website, set: setWebsite, placeholder: "https://your-site.com" },
    { id: "github", label: "GitHub profile", value: githubUrl, set: setGithubUrl, placeholder: "https://github.com/username" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-white/10 bg-[#141414] p-8"
    >
      <div className="rounded-lg border border-white/10 bg-[#090909] px-4 py-3">
        <p className="text-xs text-zinc-500">Username (permanent)</p>
        <p className="text-sm text-[#E5C76B]">@{profile.username}</p>
      </div>

      {fields.map((field) => (
        <div key={field.id}>
          <label htmlFor={field.id} className="mb-1.5 block text-xs text-zinc-400">
            {field.label}
          </label>
          <input
            id={field.id}
            type="text"
            value={field.value}
            onChange={(e) => field.set(e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
          />
        </div>
      ))}

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-xs text-zinc-400">
          Bio
        </label>
        <textarea
          id="bio"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short biography — who you are and what you build."
          className="w-full rounded-lg border border-white/10 bg-[#090909] px-4 py-3 text-sm outline-none transition focus:border-[#C9A227]/60"
        />
      </div>

      <div>
        <label htmlFor="skills" className="mb-1.5 block text-xs text-zinc-400">
          Skills (comma separated)
        </label>
        <input
          id="skills"
          type="text"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="TypeScript, Next.js, Supabase"
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
          Profile saved.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#C9A227] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#E5C76B] disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}

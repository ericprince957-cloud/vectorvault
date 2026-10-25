import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import ChangePassword from "@/components/ChangePassword";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, bio, website, location, github_url, skills")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My profile</h1>
          <p className="mt-2 text-sm text-zinc-400">
            This information appears on your public profile.
          </p>
        </div>
        <Link
          href={"/" + (profile?.username || "")}
          className="rounded-lg border border-white/15 px-5 py-2.5 text-sm transition hover:border-white/40"
        >
          View public profile
        </Link>
      </div>

      {profile ? (
        <div className="space-y-8">
          <ProfileForm profile={profile} />
          <ChangePassword />
        </div>
      ) : (
        <p className="text-sm text-zinc-400">
          Profile not found. Please contact support.
        </p>
      )}
    </div>
  );
}

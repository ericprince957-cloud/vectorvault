// Server-side helper that resolves the authenticated viewer's
// relationship to a repository. The values returned here are
// used only to render the right interface; every mutation is
// still enforced by Supabase Row Level Security, so a tampered
// or stale value can never grant actual access.

import { createClient } from "@/lib/supabase/server";
import type { CollaboratorRole } from "@/types/database";

export type RepoRole = "owner" | CollaboratorRole;

export type RepoAccess = {
  role: RepoRole | null;
  isOwner: boolean;
  isAuthenticated: boolean;
  /** Viewer is an accepted collaborator (any role) — or owner. */
  canRead: boolean;
  /** Viewer may upload, edit and delete repository content. */
  canWrite: boolean;
  /** Viewer may manage collaborators and repository settings. */
  canAdmin: boolean;
};

const NO_ACCESS: RepoAccess = {
  role: null,
  isOwner: false,
  isAuthenticated: false,
  canRead: false,
  canWrite: false,
  canAdmin: false,
};

export async function getRepoAccess(
  repositoryId: string
): Promise<RepoAccess> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NO_ACCESS;
  }

  const { count: owned } = await supabase
    .from("repositories")
    .select("*", { count: "exact", head: true })
    .eq("id", repositoryId)
    .eq("owner_id", user.id);

  if ((owned ?? 0) > 0) {
    return {
      role: "owner",
      isOwner: true,
      isAuthenticated: true,
      canRead: true,
      canWrite: true,
      canAdmin: true,
    };
  }

  // RLS only returns the viewer's own membership rows.
  const { data: membership } = await supabase
    .from("repository_collaborators")
    .select("role")
    .eq("repository_id", repositoryId)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .maybeSingle();

  const role = (membership?.role as CollaboratorRole) ?? null;

  return {
    role,
    isOwner: false,
    isAuthenticated: true,
    canRead: role !== null,
    canWrite: role === "write" || role === "admin",
    canAdmin: role === "admin",
  };
}

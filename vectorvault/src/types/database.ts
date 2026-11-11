// Shared TypeScript types for VectorVault database entities.
// Column names mirror the live Supabase tables exactly.

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  location: string | null;
  github_url: string | null;
  skills: string[];
  created_at: string;
  updated_at: string;
};

export type RepositoryVisibility = "public" | "private";

export type Repository = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  visibility: RepositoryVisibility;
  topics: string[];
  created_at: string;
  updated_at: string;
};

export type RepositoryFile = {
  id: string;
  repository_id: string;
  file_name: string;
  file_path: string | null;
  storage_path: string;
  file_size: number;
  created_at: string;
};

export type CollaboratorRole = "read" | "write" | "admin";

export type InvitationStatus = "pending" | "accepted" | "declined";

export type RepositoryCollaborator = {
  id: string;
  repository_id: string;
  user_id: string;
  role: CollaboratorRole;
  invited_by: string | null;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
};

export type IssueStatus = "open" | "closed";

export type IssuePriority = "low" | "normal" | "high" | "urgent";

export const ISSUE_PRIORITIES: IssuePriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
];

export type Issue = {
  id: string;
  repository_id: string;
  author_id: string;
  title: string;
  body: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  labels: string[];
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type IssueComment = {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type NotificationType =
  | "follow"
  | "star"
  | "repository_invitation"
  | "issue_assigned"
  | "issue_comment"
  | "mention"
  | "system";

export type AppNotification = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

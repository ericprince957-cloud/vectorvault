import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificationList, {
  type NotificationView,
} from "@/components/notifications/NotificationList";

// Notification centre. RLS on the notifications table means the
// query below can only ever return the signed-in user's own rows.

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select(
      "id, recipient_id, actor_id, type, title, body, link, read_at, created_at"
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = notifications ?? [];
  const actorIds = Array.from(
    new Set(
      rows
        .map((n) => n.actor_id as string | null)
        .filter((id): id is string => !!id)
    )
  );

  const { data: actors } = actorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", actorIds)
    : { data: [] };

  const actorById = new Map<
    string,
    { username: string | null; avatar_url: string | null }
  >();
  for (const actor of actors ?? []) {
    actorById.set(actor.id as string, {
      username: (actor.username as string) ?? null,
      avatar_url: (actor.avatar_url as string) ?? null,
    });
  }

  const views: NotificationView[] = rows.map((n) => {
    const actor = n.actor_id ? actorById.get(n.actor_id as string) : undefined;
    return {
      id: n.id as string,
      recipient_id: n.recipient_id as string,
      actor_id: (n.actor_id as string) ?? null,
      type: n.type as string,
      title: n.title as string,
      body: (n.body as string) ?? null,
      link: (n.link as string) ?? null,
      read_at: (n.read_at as string) ?? null,
      created_at: n.created_at as string,
      actor_username: actor?.username ?? null,
      actor_avatar: actor?.avatar_url ?? null,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Notifications</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Stars, followers, invitations and issue activity.
        </p>
      </div>

      <NotificationList notifications={views} />
    </div>
  );
}

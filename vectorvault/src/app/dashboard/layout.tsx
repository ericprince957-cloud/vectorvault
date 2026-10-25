import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/repositories", label: "My Repositories" },
  { href: "/dashboard/profile", label: "My Profile" },
  { href: "/dashboard/profile", label: "Settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const initials = (profile?.full_name || profile?.username || "V")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-full flex-col border-b border-white/10 bg-[#0d0d0d] md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <Image
            src="/vectorvault-logo.png"
            alt="VectorVault logo"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="font-semibold tracking-tight">VectorVault</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-4 flex items-center gap-3">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Avatar"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C9A227]/20 text-xs font-bold text-[#E5C76B]">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">
                {profile?.full_name || "Developer"}
              </p>
              <p className="truncate text-xs text-zinc-500">
                @{profile?.username || "username"}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-5 py-8 md:px-10">{children}</main>
    </div>
  );
}

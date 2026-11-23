"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/dashboard/repositories", label: "Repositories", icon: "▤" },
  { href: "/dashboard/invitations", label: "Invitations", icon: "✉" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "◉" },
  { href: "/dashboard/profile", label: "My Profile", icon: "◎" },
];

type DashboardShellProps = {
  children: React.ReactNode;
  profile: {
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export default function DashboardShell({
  children,
  profile,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (profile.fullName || profile.username || "V")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebar = (
    <aside
      className={`flex h-full min-h-0 shrink-0 flex-col border-r border-white/10 bg-[#080808]/80 backdrop-blur-2xl transition-[width] duration-200
        ${collapsed ? "w-[76px]" : "w-64"}`}
    >
      <div className={`flex h-[72px] items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <Image
            src="/vectorvault-logo.png"
            alt="VectorVault logo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
          />
          {!collapsed && <span className="truncate font-semibold tracking-tight">VectorVault</span>}
        </Link>
        {!collapsed && <NotificationBell />}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 text-sm">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 transition
                ${active ? "bg-[#C9A227]/15 text-[#E5C76B]" : "text-zinc-400 hover:bg-white/5 hover:text-white"}
                ${collapsed ? "justify-center" : ""}`}
            >
              <span aria-hidden="true" className="w-5 shrink-0 text-center text-lg">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className={`mb-4 flex items-center gap-3 ${collapsed ? "justify-center" : "px-1"}`}>
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt="Profile avatar"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C9A227]/20 text-xs font-bold text-[#E5C76B]">
              {initials}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">{profile.fullName || "Developer"}</p>
              <p className="truncate text-xs text-zinc-500">@{profile.username || "username"}</p>
            </div>
          )}
        </div>
        <div className={collapsed ? "flex justify-center" : ""}>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-black/25 text-white backdrop-blur-[2px]">
      <div className="relative hidden md:flex">
        {sidebar}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute left-0 top-[84px] z-20 hidden h-8 w-5 translate-x-[calc(16rem-10px)] items-center justify-center rounded-r-md border border-white/10 bg-[#191919] text-xs text-zinc-300 transition-all hover:text-[#E5C76B] md:flex"
          style={{ transform: collapsed ? "translateX(66px)" : "translateX(246px)" }}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="relative z-10 h-full shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 bg-black/65 px-4 backdrop-blur-2xl md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-xl text-zinc-200"
            >
              ☰
            </button>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Image src="/vectorvault-logo.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
              VectorVault
            </Link>
          </div>
          <NotificationBell />
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

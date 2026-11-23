"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type DashboardShellProps = {
  children: React.ReactNode;
  profile: {
    username: string | null;
    fullName: string | null;
    avatarUrl: string | null;
  };
};

export default function DashboardShell({ children, profile }: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileHref = profile.username ? `/${profile.username}` : "/dashboard/profile";
  const navigation = [
    { label: "Overview", href: "/dashboard", icon: "⌂" },
    { label: "Repositories", href: "/dashboard/repositories", icon: "▤" },
    { label: "Issues", href: "/dashboard/issues", icon: "◎", count: "Track" },
    { label: "Pull requests", href: "/dashboard/pull-requests", icon: "⑂" },
    { label: "Discussions", href: "/dashboard/discussions", icon: "◌" },
  ];
  const initials = (profile.fullName || profile.username || "V")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebar = (
    <aside className={`flex h-full min-h-0 shrink-0 flex-col border-r border-white/10 bg-[#080808]/85 backdrop-blur-2xl transition-[width] duration-200 ${collapsed ? "w-[76px]" : "w-64"}`}>
      <div className={`flex h-[72px] shrink-0 items-center border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-5"}`}>
        <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center gap-3">
          <Image src="/vectorvault-logo.png" alt="VectorVault logo" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
          {!collapsed && <span className="truncate font-semibold tracking-tight">VectorVault</span>}
        </Link>
      </div>

      <div className={`shrink-0 px-3 pt-5 ${collapsed ? "flex justify-center" : ""}`}>
        <Link
          href="/dashboard/repositories/new"
          onClick={() => setMobileOpen(false)}
          title="Create repository"
          aria-label="Create repository"
          className={`group flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/55 bg-[#C9A227]/[0.08] text-sm font-medium text-[#E5C76B] shadow-[0_0_30px_rgba(201,162,39,0.08)] transition hover:border-[#F4E2A0] hover:bg-[#C9A227]/15 ${collapsed ? "w-11 text-2xl" : "w-full px-4"} ${pathname === "/dashboard/repositories/new" ? "ring-1 ring-[#D4AF37]/40" : ""}`}
        >
          <span className="text-xl font-light leading-none">+</span>
          {!collapsed && <span>Create repository</span>}
        </Link>
      </div>

      <nav aria-label="Workspace navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {!collapsed && <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">Workspace</p>}
        {navigation.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={item.label}
              aria-label={item.label}
              className={`group flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] transition ${collapsed ? "justify-center" : ""} ${active ? "border border-[#D4AF37]/20 bg-[#C9A227]/[0.09] text-[#F0D987]" : "border border-transparent text-zinc-400 hover:border-white/[0.07] hover:bg-white/[0.045] hover:text-white"}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none">{item.icon}</span>
              {!collapsed && <span className="min-w-0 flex-1">{item.label}</span>}
              {!collapsed && item.count && <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] text-zinc-600">Soon</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`flex shrink-0 flex-col items-center gap-3 border-t border-white/10 px-3 py-4 ${collapsed ? "" : "flex-row justify-start"}`}>
        <Link
          href={profileHref}
          onClick={() => setMobileOpen(false)}
          title={profile.fullName || profile.username || "View profile"}
          aria-label="View profile"
          className={`group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border bg-black/40 transition hover:scale-105 hover:border-[#E5C76B] ${pathname === profileHref || pathname === "/dashboard/profile" ? "border-[#D4AF37]/80 ring-2 ring-[#D4AF37]/15" : "border-white/20"}`}
        >
          {profile.avatarUrl ? (
            <Image src={profile.avatarUrl} alt="Your profile" width={44} height={44} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-[#E5C76B]">{initials}</span>
          )}
        </Link>
        {!collapsed && <span className="-mt-2 max-w-full truncate text-[10px] text-zinc-500">Profile</span>}
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
          className="absolute left-0 top-[84px] z-20 hidden h-8 w-5 items-center justify-center rounded-r-md border border-white/10 bg-[#191919] text-xs text-zinc-300 transition hover:text-[#E5C76B] md:flex"
          style={{ transform: collapsed ? "translateX(66px)" : "translateX(246px)" }}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button type="button" aria-label="Close navigation menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative z-10 h-full shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center justify-between border-b border-white/10 bg-black/65 px-4 backdrop-blur-2xl md:hidden">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-xl text-zinc-200">☰</button>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Image src="/vectorvault-logo.png" alt="" width={27} height={27} className="h-7 w-7 object-contain" />
              VectorVault
            </Link>
          </div>
          <Link href={profileHref} aria-label="View profile" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#D4AF37]/50 bg-black/40 text-xs font-semibold text-[#E5C76B]">
            {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" width={40} height={40} className="h-full w-full object-cover" /> : initials}
          </Link>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  );
}

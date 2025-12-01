"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const items = [
  { href: "/dashboard", label: "ダッシュボード", icon: "dashboard" },
  { href: "/profile", label: "プロフィール", icon: "user" },
  { href: "/videos", label: "動画管理", icon: "video" },
  { href: "/offers", label: "受信オファー", icon: "inbox" },
  { href: "/follows", label: "フォロー済み企業", icon: "follow" },
  { href: "/footprints", label: "足あと", icon: "foot" },
  { href: "/companies", label: "企業を探す", icon: "search" },
  { href: "/notifications", label: "通知", icon: "bell" },
  { href: "/chats", label: "チャット", icon: "chat" },
];

function Icon({ name }: { name: string }) {
  switch (name) {
    case "dashboard":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h5v8H3v-8zm7 4h11v4H10v-4z" stroke="currentColor" strokeWidth="1.7" fill="none" />
        </svg>
      );
    case "user":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 20a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "video":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="5" width="13" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M20 7l-4 3v4l4 3V7z" fill="currentColor" />
        </svg>
      );
    case "inbox":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16l-2 10H6L4 7zm2 8h12l1-6H5l1 6z" stroke="currentColor" strokeWidth="1.7" fill="none" />
        </svg>
      );
    case "bell":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm7-6V11a7 7 0 10-14 0v5l-2 2h18l-2-2z" stroke="currentColor" strokeWidth="1.7" fill="none" />
        </svg>
      );
    case "chat":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 5h16v10H8l-4 4V5z" stroke="currentColor" strokeWidth="1.7" fill="none" />
          <circle cx="9" cy="10" r="1" fill="currentColor" />
          <circle cx="13" cy="10" r="1" fill="currentColor" />
          <circle cx="17" cy="10" r="1" fill="currentColor" />
        </svg>
      );
    case "search":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "follow":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3 21c1.5-3.5 5-6 9-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M16 19l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "foot":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M8 14c-2 0-3.5 1.2-3.5 3s1.5 3 3.5 3 3.5-1.2 3.5-3-1.5-3-3.5-3z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M14.5 3.5c1 .8 1.7 2 1.7 3.3 0 1.3-1.1 2.7-2.4 3.2-1.2.4-2.6-.2-3.3-1.3-.7-1.1-.6-2.6.2-3.6.9-1.2 2.4-1.7 3.8-1.6z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    default:
      return null;
  }
}

export default function StudentSidebar() {
  const pathname = usePathname();
  const [notifCount, setNotifCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const path = pathname || "";
  const isChatScoped = useMemo(() => {
    if (!path) return false;
    if (path.startsWith("/chats")) return true;
    // オファー配下のチャット/プロフィールはチャット扱い
    return /^\/offers\/[^/]+\/(chat|profile)(\/|$)?/.test(path);
  }, [path]);

  useEffect(() => {
    let timer: any;
    const load = async () => {
      try {
        const [nres, cres] = await Promise.all([
          fetch("/api/notifications", { cache: "no-store" }),
          fetch("/api/offers/unread-count", { cache: "no-store" }),
        ]);
        if (nres.ok) {
          const nd = await nres.json();
          const unread = (nd.notifications || []).filter((x: any) => !x.readAt).length;
          setNotifCount(unread);
        }
        if (cres.ok) {
          const cd = await cres.json();
          setChatCount(cd.unread || 0);
        }
      } catch {}
    };
    load();
    timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);
  return (
    <aside className="w-14 md:w-56 shrink-0 border-r border-neutral-200 bg-white sticky top-0 h-screen">
      <Link href="/dashboard" className="px-2 md:px-4 py-4 text-lg font-semibold flex items-center justify-center md:justify-start tracking-tight">
        <span className="hidden md:inline">JobSwipe</span>
        <span className="md:hidden">JS</span>
      </Link>
      <nav className="px-1 md:px-2 py-2 space-y-1">
        {items.map((it) => {
          const isOffersItem = it.href === "/offers";
          const baseActive = path === it.href || (it.href !== "/" && path.startsWith(it.href));
          const active = it.icon === "chat"
            ? isChatScoped || path === it.href
            : isOffersItem && isChatScoped
              ? false
              : baseActive;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-2 rounded-md px-2 md:px-3 py-2 text-sm justify-center md:justify-start transition-colors ${
                active ? "bg-indigo-600 text-white" : "text-neutral-800 hover:bg-indigo-50"
              }`}
            >
              <span className="shrink-0 text-current">
                <Icon name={it.icon} />
              </span>
              <span className="hidden md:inline-flex items-center gap-2">
                <span className="truncate">{it.label}</span>
                {it.icon === "bell" && notifCount > 0 && (
                  <span className="text-[11px] bg-red-600 text-white rounded-full px-1.5">{notifCount}</span>
                )}
                {it.icon === "chat" && chatCount > 0 && (
                  <span className="text-[11px] bg-red-600 text-white rounded-full px-1.5">{chatCount}</span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

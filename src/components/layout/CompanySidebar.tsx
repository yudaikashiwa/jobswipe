"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "ダッシュボード", icon: "dashboard" },
  { href: "/profile", label: "プロフィール", icon: "user" },
  { href: "/swipe", label: "スワイプを見る", icon: "video" },
  { href: "/likes", label: "気になるリスト", icon: "heart" },
  { href: "/offers", label: "送信済みオファー", icon: "send" },
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
    case "heart":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 20s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0119 11c0 4.65-7 9-7 9z" stroke="currentColor" strokeWidth="1.7" fill="none" />
        </svg>
      );
    case "send":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 4l16 8-16 8 4-8-4-8z" stroke="currentColor" strokeWidth="1.7" fill="none" />
          <path d="M8 12h12" stroke="currentColor" strokeWidth="1.7" />
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
    default:
      return null;
  }
}

export default function CompanySidebar() {
  const pathname = usePathname();
  const path = pathname || "";
  const isChatScoped = (() => {
    if (!path) return false;
    if (path.startsWith("/chats")) return true;
    return /^\/offers\/[^/]+\/(chat|profile)(\/|$)?/.test(path);
  })();
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
              <span className="shrink-0 text-current"><Icon name={it.icon} /></span>
              <span className="truncate hidden md:inline">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

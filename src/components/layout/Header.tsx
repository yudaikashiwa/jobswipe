"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SignOutButton } from "@/components/SignOutButton";

export default function Header() {
  const { data } = useSession();
  const [notif, setNotif] = useState(0);
  const [chat, setChat] = useState(0);

  const load = async () => {
    try {
      const [nres, cres] = await Promise.all([
        fetch("/api/notifications", { cache: "no-store" }),
        fetch("/api/offers/unread-count", { cache: "no-store" }),
      ]);
      if (nres.ok) {
        const nd = await nres.json();
        const unread = (nd.notifications || []).filter((x: any) => !x.readAt).length;
        setNotif(unread);
      }
      if (cres.ok) {
        const cd = await cres.json();
        setChat(cd.unread || 0);
      }
    } catch {}
  };

  useEffect(() => {
    if (!data?.user) return;
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [data?.user?.id]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-neutral-200">
      <div className="app-container py-3 flex items-center justify-between">
        {data?.user?.userType === "COMPANY" || data?.user?.userType === "STUDENT" ? (
          <div />
        ) : (
          <Link href="/" className="font-semibold tracking-tight text-neutral-900">JobSwipe</Link>
        )}
        {data?.user ? (
          <SignOutButton variant="icon" />
        ) : null}
      </div>
    </header>
  );
}

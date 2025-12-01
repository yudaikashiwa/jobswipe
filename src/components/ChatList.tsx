"use client";
import { useMemo, useState } from "react";

type Item = {
  offer: { id: string };
  latest?: { content?: string | null; attachmentName?: string | null } | null;
  unread: number;
  counterpartEmail?: string | null;
  counterpartAvatarUrl?: string | null;
  hasReplied?: boolean;
};

export default function ChatList({ items }: { items: Item[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) =>
      (i.counterpartEmail || "").toLowerCase().includes(s) ||
      (i.latest?.content || "").toLowerCase().includes(s) ||
      (i.latest?.attachmentName || "").toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">チャット</h1>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ユーザー/本文検索" className="border rounded px-2 py-1 text-sm" />
          {q && (
            <button onClick={() => setQ("")} className="text-sm border rounded px-2 py-1 border-neutral-300 text-neutral-700 hover:bg-neutral-50">クリア</button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 && <p className="text-sm text-neutral-600">チャットはまだありません。</p>}
        {filtered.map((i) => (
          <a key={i.offer.id} href={`/chats/${i.offer.id}`} className="border rounded-xl bg-white p-3 pr-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-neutral-200 border">
                {i.counterpartAvatarUrl ? (
                  <img src={i.counterpartAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{i.counterpartEmail}</div>
                <div className="text-sm text-neutral-600 mt-0.5 line-clamp-1">{i.latest?.content || i.latest?.attachmentName || "(添付)"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!i.hasReplied && (
                <span className="text-xs border border-amber-600 text-amber-700 rounded px-2 py-0.5">未返信</span>
              )}
              {i.unread > 0 && <span className="text-xs bg-red-600 text-white rounded-full px-2 py-1">{i.unread}</span>}
            </div>
          </a>
        ))}
      </div>
    </>
  );
}

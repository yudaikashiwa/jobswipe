"use client";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  offerId: string;
  senderId: string;
  receiverId: string;
  content: string;
  sentAt: string;
  // Optional fields returned from API/SSE
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  // Enriched flag when includeReads=1
  isReadByReceiver?: boolean;
};

export default function ChatWindow({ offerId, selfId, canReply = true, acceptanceAt }: { offerId: string; selfId: string; canReply?: boolean; acceptanceAt?: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);
  const acceptanceIndexRef = useRef<number | null>(null);

  const mergeUnique = (current: Message[], incoming: Message[]) => {
    const map = new Map<string, any>();
    for (const m of current as any[]) map.set(m.id, m);
    for (const inc of incoming as any[]) {
      const prev = map.get(inc.id);
      if (prev) {
        // 既存の既読フラグを保持（SSEは isReadByReceiver を持たないため上書きされないように）
        const merged: any = { ...prev, ...inc };
        if (inc.isReadByReceiver === undefined && prev.isReadByReceiver !== undefined) {
          merged.isReadByReceiver = prev.isReadByReceiver;
        }
        map.set(inc.id, merged);
      } else {
        map.set(inc.id, inc);
      }
    }
    // 送信時刻で昇順ソート
    return Array.from(map.values()).sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  };

  const fetchMessages = async (opts?: { older?: boolean }) => {
    try {
      const qparam = query ? `&q=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/offers/${offerId}/messages?page=${opts?.older ? page + 1 : 1}&pageSize=${pageSize}&includeReads=1${qparam}` , { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setTotal(data.total || 0);
      if (opts?.older) {
        setPage((p) => p + 1);
        setMessages((prev) => mergeUnique([...(data.messages || [])], prev));
      } else {
        setPage(1);
        setMessages((prev) => mergeUnique(prev, data.messages || []));
      }
      // acceptance position recompute
      if (acceptanceAt) {
        setTimeout(() => {
          const at = new Date(acceptanceAt).getTime();
          const idx = (data.messages || [])
            .sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
            .findIndex((m: any) => new Date(m.sentAt).getTime() > at);
          if (idx >= 0) acceptanceIndexRef.current = idx - 1;
        }, 0);
      }
      setError(null);
    } catch {
      setError("取得に失敗しました");
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    // クエリが無い時のみSSEで追従（検索中は固定）
    if (!query) {
      const es = new EventSource(`/api/offers/${offerId}/messages/stream`);
      es.addEventListener("messages", (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          if (Array.isArray(payload) && payload.length) {
            setMessages((prev) => mergeUnique(prev, payload));
            setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
          }
        } catch {}
      });
      es.addEventListener("typing", (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          const other = payload?.find((p: any) => p.userId !== selfId);
          setOtherTyping(!!other);
        } catch {}
      });
      es.onerror = () => { /* auto reconnect via EventSource retry */ };
      return () => { es.close(); };
    }
  }, [offerId, selfId, query]);

  const send = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/offers/${offerId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setContent("");
        // SSEに任せるが保険で最新取得
        fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const onTyping = async (val: string) => {
    setContent(val);
    if (!typing) {
      setTyping(true);
      fetch(`/api/offers/${offerId}/messages`, { method: "PUT" }).finally(() => setTimeout(() => setTyping(false), 3000));
    }
  };

  const onFileChange = async (f: File | null) => {
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    fd.append("content", content.trim());
    await fetch(`/api/offers/${offerId}/messages`, { method: "POST", body: fd });
    setContent("");
    fetchMessages();
  };

  // 動的検索（入力に応じて絞り込み）
  useEffect(() => {
    const h = setTimeout(() => {
      setQuery(queryInput.trim());
      fetchMessages();
    }, 300);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="px-5 py-3 border-b bg-neutral-50 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">チャット</h3>
        <div className="ml-auto flex items-center gap-2">
          <input value={queryInput} onChange={(e) => setQueryInput(e.target.value)} placeholder="キーワード検索" className="border rounded px-2 py-1 text-sm" />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setQueryInput(""); fetchMessages(); }} className="text-sm border rounded px-2 py-1 border-neutral-300 text-neutral-700 hover:bg-neutral-50">クリア</button>
          )}
        </div>
      </div>
      <div className="h-[60vh] overflow-y-auto p-4 bg-neutral-50/50">
        {page * pageSize < (messages.length || pageSize) && (
          <div className="mb-2 flex justify-center">
            <button onClick={() => fetchMessages({ older: true })} className="text-xs inline-flex items-center px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">もっと読む</button>
          </div>
        )}
        {loading ? (
          <p className="text-sm text-neutral-600">読み込み中...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m, i) => {
              const mine = m.senderId === selfId;
              const time = new Date(m.sentAt).toLocaleTimeString();
              const isRead = (m as any).isReadByReceiver as boolean | undefined;
              if (mine) {
                return (
                  <li key={m.id} className="flex justify-end">
                    <div className="flex items-end gap-1">
                      <div className="text-[10px] text-neutral-500 whitespace-nowrap">
                        {isRead ? "既読 " : ""}{time}
                      </div>
                      <div className="max-w-[75%] rounded px-3 py-2 text-sm bg-indigo-600 text-white ml-auto">
                        {m.attachmentUrl ? (
                          m.attachmentType?.startsWith("image/") ? (
                            <img src={m.attachmentUrl} alt={m.attachmentName || "attachment"} className="max-w-full rounded mb-2 block" />
                          ) : (
                            <a href={m.attachmentUrl} target="_blank" className="underline break-words inline-block">{m.attachmentName || "添付ファイル"}</a>
                          )
                        ) : null}
                        {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                        {acceptanceAt && acceptanceIndexRef.current === i && (
                          <div className="mt-1 text-[11px] text-neutral-500">オファーを承諾しました</div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              }
              return (
                <li key={m.id} className="flex justify-start">
                  <div className="flex items-end gap-1">
                    <div className="max-w-[75%] rounded px-3 py-2 text-sm bg-white border">
                      {m.attachmentUrl ? (
                        m.attachmentType?.startsWith("image/") ? (
                          <img src={m.attachmentUrl} alt={m.attachmentName || "attachment"} className="max-w-full rounded mb-2 block" />
                        ) : (
                          <a href={m.attachmentUrl} target="_blank" className="underline break-words inline-block">{m.attachmentName || "添付ファイル"}</a>
                        )
                      ) : null}
                      {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                    </div>
                    <div className="text-[10px] text-neutral-500 whitespace-nowrap">{time}</div>
                  </div>
                </li>
              );
            })}
            <div ref={endRef} />
          </ul>
        )}
      </div>
      <div className="p-3 border-t bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={content}
            onChange={(e) => onTyping(e.target.value)}
            rows={2}
            placeholder={canReply ? "メッセージを入力" : "オファーを受諾すると返信できます"}
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-neutral-100"
            disabled={!canReply}
          />
          <label className={`h-10 px-3 inline-flex items-center rounded border border-neutral-300 ${canReply ? "cursor-pointer" : "opacity-60 cursor-not-allowed"}`}>
            添付
            <input type="file" accept="image/*,application/pdf,application/zip" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] || null)} disabled={!canReply} />
          </label>
          <button onClick={send} disabled={sending || !content.trim() || !canReply} className="h-10 px-4 rounded border border-indigo-600 bg-indigo-600 text-white disabled:opacity-60 hover:bg-indigo-700">
            送信
          </button>
        </div>
        {otherTyping && canReply && <div className="text-xs text-neutral-600 mt-1">相手が入力中...</div>}
      </div>
    </div>
  );
}

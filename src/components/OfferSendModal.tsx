"use client";
import { useEffect, useState } from "react";

export default function OfferSendModal({ studentProfileId, studentLabel }: { studentProfileId: string; studentLabel: string; }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [templates, setTemplates] = useState<Array<{ id: string; title: string; body: string }>>([]);
  const [confirming, setConfirming] = useState(false);

  // 下書き: localStorage に studentProfileId 単位で保存
  useEffect(() => {
    if (!open) return;
    const draft = localStorage.getItem(`offer:draft:${studentProfileId}`);
    if (draft) setMessage(draft);
    (async () => {
      const res = await fetch("/api/offer-templates", { cache: "no-store" });
      const data = await res.json().catch(() => ({ templates: [] }));
      setTemplates(data.templates || []);
    })();
  }, [open, studentProfileId]);

  useEffect(() => {
    if (!open) return;
    localStorage.setItem(`offer:draft:${studentProfileId}`, message);
  }, [message, open, studentProfileId]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentProfileId, message }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => setOpen(false), 1000);
        localStorage.removeItem(`offer:draft:${studentProfileId}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "送信に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">オファー送信</button>
      {!open ? null : (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-10 mx-auto w-full max-w-lg">
            <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
              <div className="px-5 py-4 border-b bg-neutral-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
                  <h3 className="text-base font-semibold">オファー送信</h3>
                </div>
                <button onClick={() => setOpen(false)} className="text-sm text-neutral-600 hover:text-black">閉じる</button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <p className="text-sm text-neutral-700">宛先: {studentLabel}</p>
                {error && <div className="text-sm border border-red-300 bg-red-50 text-red-800 rounded px-3 py-2">{error}</div>}
                {done ? (
                  <p className="text-sm text-green-700">送信しました。</p>
                ) : (
                  <>
                    {templates.length > 0 && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-neutral-700">テンプレート:</label>
                        <select onChange={(e) => setMessage(e.target.value)} className="border rounded px-2 py-1 text-sm">
                          <option value="">選択してください</option>
                          {templates.map((t) => (
                            <option key={t.id} value={t.body}>{t.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <label className="block text-sm font-medium mb-1 text-neutral-800">メッセージ</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="自己紹介動画を拝見し、ぜひ一度お話ししたくご連絡しました..." className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button onClick={() => setOpen(false)} className="text-sm inline-flex items-center px-3 py-2 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">キャンセル</button>
                      {!confirming ? (
                        <button disabled={loading || !message.trim()} onClick={() => setConfirming(true)} className="inline-flex items-center border border-indigo-600 bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-60 hover:bg-indigo-700">確認へ</button>
                      ) : (
                        <>
                          <span className="text-sm text-neutral-600 mr-2">この内容で送信しますか？</span>
                          <button disabled={loading} onClick={submit} className="inline-flex items-center border border-indigo-600 bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-60 hover:bg-indigo-700">送信</button>
                          <button onClick={() => setConfirming(false)} className="inline-flex items-center border border-neutral-300 text-neutral-700 rounded px-3 py-2">戻る</button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

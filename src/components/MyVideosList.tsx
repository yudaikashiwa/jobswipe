"use client";
import { useEffect, useState } from "react";
import EditVideoModal from "@/components/EditVideoModal";

type Video = {
  id: string;
  videoUrl: string;
  title: string;
  description: string | null;
  uploadedAt: string;
  isPublic: boolean;
  sortOrder: number;
  isFeatured?: boolean;
};

export default function MyVideosList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [current, setCurrent] = useState<Video | null>(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/videos/mine", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setVideos(data.videos || []);
    } catch {
      setError("取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onUpdated = () => load();
    window.addEventListener("videos:updated", onUpdated);
    return () => window.removeEventListener("videos:updated", onUpdated);
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm("この動画を削除しますか？")) return;
    const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setVideos((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const toggleVisibility = async (v: Video) => {
    await fetch(`/api/videos/${v.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPublic: !v.isPublic }) });
    load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = videos[index];
    const swapIndex = index + dir;
    if (swapIndex < 0 || swapIndex >= videos.length) return;
    const other = videos[swapIndex];
    // swap sortOrder
    await fetch(`/api/videos/${target.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: other.sortOrder }) });
    await fetch(`/api/videos/${other.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: target.sortOrder }) });
    load();
  };

  // 代表動画指定（1つ）
  const setFeatured = async (id: string) => {
    const current = videos.find((v) => v.id === id);
    if (!current) return;
    // クライアントからは対象のみtrue。サーバ側で他をfalseにするAPIが無いので暫定で2リクエスト
    // 1) 現在trueのものをfalse
    const currentFeatured = videos.filter((v) => v.isFeatured && v.id !== id);
    await Promise.all(currentFeatured.map((v) => fetch(`/api/videos/${v.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFeatured: false }) })));
    // 2) 対象をtrue
    await fetch(`/api/videos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isFeatured: true }) });
    load();
  };

  return (
    <div className="border rounded-xl shadow-sm overflow-hidden bg-white">
      <div className="px-6 py-5 border-b bg-neutral-50">
        <div className="flex items-center gap-3">
          <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
          <h2 className="text-lg font-semibold text-neutral-900">あなたの動画</h2>
        </div>
      </div>
      <div className="px-6 py-5">
        {loading ? (
          <p className="text-sm text-neutral-600">読み込み中...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : videos.length === 0 ? (
          <p className="text-sm text-neutral-600">まだ動画がありません。上のフォームからアップロードできます。</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map((v, i) => (
              <li key={v.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-black">
                  <video src={v.videoUrl} controls className="w-full h-full" />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{v.title}</h3>
                    <span className={`text-xs rounded px-2 py-0.5 border ${v.isPublic ? "border-green-600 text-green-700" : "border-neutral-500 text-neutral-600"}`}>{v.isPublic ? "公開" : "非公開"}</span>
                  </div>
                  {v.description && (
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{v.description}</p>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <div className="text-xs text-neutral-600">並び順: {v.sortOrder} {v.isFeatured && <span className="ml-2 text-amber-700 border border-amber-600 px-2 py-0.5 rounded">代表</span>}</div>
                    <div className="flex gap-2">
                      <button onClick={() => move(i, -1)} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">上へ</button>
                      <button onClick={() => move(i, 1)} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">下へ</button>
                      <button onClick={() => setFeatured(v.id)} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-amber-600 text-amber-700 hover:bg-amber-50">代表にする</button>
                      <button onClick={() => toggleVisibility(v)} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">{v.isPublic ? "非公開にする" : "公開にする"}</button>
                      <button onClick={() => { setCurrent(v); setEditOpen(true); }} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">
                        編集
                      </button>
                      <button onClick={() => onDelete(v.id)} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-neutral-900 text-neutral-900 hover:bg-neutral-100">
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <EditVideoModal open={editOpen} onClose={() => setEditOpen(false)} video={current} />
    </div>
  );
}

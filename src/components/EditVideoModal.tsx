"use client";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  video: {
    id: string;
    title: string;
    description: string | null;
    tags?: string[] | null;
  } | null;
};

export default function EditVideoModal({ open, onClose, video }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (video) {
      setTitle(video.title || "");
      setDescription(video.description || "");
      setTags(Array.isArray(video.tags) ? video.tags.join(", ") : "");
      setFile(null);
      setError(null);
    }
  }, [video]);

  if (!open || !video) return null;

  const save = async () => {
    setError(null);
    if (!title.trim()) return setError("タイトルは必須です");
    setLoading(true);
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("description", description.trim());
        fd.append("tags", tags.trim());
        fd.append("video", file);
        res = await fetch(`/api/videos/${video.id}`, { method: "PATCH", body: fd });
      } else {
        const payload: any = { title: title.trim() };
        if (description.trim() !== "") payload.description = description.trim();
        else payload.description = null;
        if (tags.trim() !== "") payload.tags = tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10);
        res = await fetch(`/api/videos/${video.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        window.dispatchEvent(new CustomEvent("videos:updated"));
        onClose();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "更新に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto w-full max-w-lg">
        <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-5 py-4 border-b bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
              <h3 className="text-base font-semibold">動画を編集</h3>
            </div>
            <button onClick={onClose} className="text-sm text-neutral-600 hover:text-black">閉じる</button>
          </div>
          <div className="px-5 py-4 space-y-4">
            {error && (
              <div className="text-sm border border-red-300 bg-red-50 text-red-800 rounded px-3 py-2">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-800">タイトル</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-800">説明</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-800">タグ（カンマ区切り）</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-neutral-800">動画の差し替え（任意）</label>
              <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" />
              {file && <p className="text-xs text-neutral-600 mt-1">選択中: {file.name}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={onClose} className="text-sm inline-flex items-center px-3 py-2 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">キャンセル</button>
              <button disabled={loading} onClick={save} className="inline-flex items-center border border-neutral-900 bg-neutral-900 text-white rounded px-4 py-2 disabled:opacity-60 hover:bg-black">
                {loading ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

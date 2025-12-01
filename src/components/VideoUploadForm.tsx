"use client";
import { useEffect, useRef, useState } from "react";

const ACCEPT = "video/*";
const MAX_MB = 50;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const MAX_SECONDS = 60;

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const dur = video.duration;
      URL.revokeObjectURL(url);
      resolve(dur);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("metadata load failed"));
    };
    video.src = url;
  });
}

export default function VideoUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFileChange = async (f: File | null) => {
    setError(null);
    setFile(null);
    if (!f) return;
    if (!f.type.startsWith("video/")) {
      setError("動画ファイルを選択してください");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`ファイルサイズが大きすぎます(最大${MAX_MB}MB)`);
      return;
    }
    try {
      const dur = await getVideoDuration(f);
      if (dur > MAX_SECONDS + 0.5) {
        setError(`動画は${MAX_SECONDS}秒以内にしてください`);
        return;
      }
      setFile(f);
    } catch {
      setError("動画の読み込みに失敗しました");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) return setError("動画ファイルが未選択です");
    if (!title.trim()) return setError("タイトルを入力してください");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("video", file);
      fd.append("title", title.trim());
      if (description.trim()) fd.append("description", description.trim());
      if (tags.trim()) fd.append("tags", tags.trim());

      const res = await fetch("/api/videos/upload", { method: "POST", body: fd });
      if (res.ok) {
        // リスト側が読み直せるようにイベント発火
        window.dispatchEvent(new CustomEvent("videos:updated"));
        // フォームをリセット
        setFile(null);
        setTitle("");
        setDescription("");
        setTags("");
        if (inputRef.current) inputRef.current.value = "";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "アップロードに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-xl shadow-sm overflow-hidden bg-white">
      <div className="px-6 py-5 border-b bg-neutral-50">
        <div className="flex items-center gap-3">
          <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
          <h2 className="text-lg font-semibold text-neutral-900">動画をアップロード</h2>
        </div>
        <p className="text-sm text-neutral-600 mt-2">最大60秒 / {MAX_MB}MB。MP4など一般的な動画形式に対応します。</p>
      </div>
      <form onSubmit={onSubmit} className="px-6 py-6 space-y-6">
        {error && (
          <div className="text-sm border border-red-300 bg-red-50 text-red-800 rounded px-3 py-2">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 text-neutral-800">動画ファイル</label>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          {file && (
            <p className="text-xs text-neutral-600 mt-1">選択中: {file.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-800">タイトル</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例) 60秒で自己紹介"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-800">タグ（カンマ区切り）</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例) 笑顔, 英語対応可"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-neutral-800">説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="動画の補足情報や見どころを記載してください"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center border border-indigo-600 bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-60 hover:bg-indigo-700"
          >
            {loading ? "アップロード中..." : "アップロード"}
          </button>
        </div>
      </form>
    </div>
  );
}

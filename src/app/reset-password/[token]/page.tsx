"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("パスワードは8文字以上にしてください");
    if (password !== confirm) return setError("パスワードが一致しません");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/login"), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "リンクが無効か期限切れです");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">パスワード再設定</h1>
        {done ? (
          <p className="mt-4 text-sm text-neutral-700">パスワードを更新しました。ログイン画面に移動します。</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm mb-1">新しいパスワード</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">新しいパスワード（確認）</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full border border-neutral-900 bg-neutral-900 text-white rounded px-4 py-2 disabled:opacity-60">
              {loading ? "更新中..." : "更新"}
            </button>
            <p className="text-xs text-neutral-600">リンクの有効期限は30分です。</p>
          </form>
        )}
        <p className="text-sm text-neutral-600 mt-4">
          <a href="/login" className="underline">ログインに戻る</a>
        </p>
      </div>
    </main>
  );
}


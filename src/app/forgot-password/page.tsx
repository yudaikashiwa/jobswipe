"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">パスワードリセット</h1>
        {sent ? (
          <p className="mt-4 text-sm text-neutral-700">入力したメール宛にパスワード再設定用のリンクを送信しました。届かない場合は迷惑メールをご確認ください。</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm mb-1">メールアドレス</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full border border-neutral-900 bg-neutral-900 text-white rounded px-4 py-2 disabled:opacity-60">
              {loading ? "送信中..." : "送信"}
            </button>
            <p className="text-xs text-neutral-600">セキュリティのため、登録有無に関わらず同じ表示になります。</p>
          </form>
        )}
        <p className="text-sm text-neutral-600 mt-4">
          <a href="/login" className="underline">ログインに戻る</a>
        </p>
      </div>
    </main>
  );
}


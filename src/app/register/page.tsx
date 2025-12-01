"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type UserType = "STUDENT" | "COMPANY";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("STUDENT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, userType }),
      });
      if (res.ok) {
        router.push("/login");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "登録に失敗しました");
      }
    } catch {
      setError("登録処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">新規登録</h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm mb-1">メールアドレス</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">パスワード</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">ユーザー種別</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-800"
            >
              <option value="STUDENT">学生</option>
              <option value="COMPANY">企業</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-neutral-900 bg-neutral-900 text-white rounded px-4 py-2 disabled:opacity-60"
          >
            {loading ? "作成中..." : "登録"}
          </button>
        </form>
        <p className="text-sm text-neutral-600 mt-4">
          すでにアカウントをお持ちの方は{" "}
          <a href="/login" className="underline">ログイン</a>
        </p>
      </div>
    </main>
  );
}


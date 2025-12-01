"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 既に認証済みならダッシュボードへ誘導
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      if (res?.ok) {
        router.replace("/");
      } else {
        setError("メールまたはパスワードが正しくありません");
      }
    } catch {
      setError("サインインに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md card p-6 sm:p-7">
        <header>
          <h1>ログイン</h1>
          <p className="mt-1 text-sm text-neutral-600">メールアドレスとパスワードを入力してください。</p>
        </header>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">メールアドレス</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              autoComplete="email"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="label">パスワード</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              autoComplete="current-password"
              placeholder="8文字以上"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "送信中..." : "ログイン"}
          </button>
        </form>
        <div className="mt-4 text-sm text-neutral-600">
          <p>
            アカウントをお持ちでない方は {" "}
            <a href="/register">新規登録</a>
          </p>
          <p className="mt-2">
            <a href="/forgot-password">パスワードをお忘れですか？</a>
          </p>
        </div>
      </div>
    </main>
  );
}

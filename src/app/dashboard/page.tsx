import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return (
    <main className="py-6">
      <div className="app-container space-y-6">
        <header>
          <h1>ダッシュボード</h1>
        </header>
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="card p-4">
            <h2 className="text-base font-semibold">アカウント情報</h2>
            <div className="mt-2 text-sm text-neutral-700">
              <p>メール: {session.user.email}</p>
              <p>ユーザー種別: {session.user.userType}</p>
            </div>
            {(session.user.userType === "STUDENT" || session.user.userType === "COMPANY") && (
              <a href="/profile" className="mt-3 inline-flex text-sm text-indigo-600">プロフィールを編集</a>
            )}
          </div>

          <div className="card p-4">
            <h2 className="text-base font-semibold">クイックアクセス</h2>
            <nav className="mt-3 grid gap-2 text-sm">
              {session.user.userType === "STUDENT" && (
                <>
                  <a href="/videos" className="btn btn-outline justify-start">動画管理へ</a>
                  <a href="/notifications" className="btn btn-outline justify-start">通知を見る</a>
                  <a href="/offers" className="btn btn-outline justify-start">受信オファー</a>
                </>
              )}
              {session.user.userType === "COMPANY" && (
                <>
                  <a href="/swipe" className="btn btn-outline justify-start">スワイプを見る</a>
                  <a href="/likes" className="btn btn-outline justify-start">気になるリスト</a>
                  <a href="/offers" className="btn btn-outline justify-start">送信済みオファー</a>
                </>
              )}
            </nav>
          </div>
        </section>

        <div>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}

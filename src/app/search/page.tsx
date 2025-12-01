import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SearchPage(props: { searchParams: Promise<{ q?: string; tags?: string; page?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "COMPANY") redirect("/dashboard");

  const q = searchParams.q || "";
  const tags = searchParams.tags || "";
  const page = Number(searchParams.page || 1);
  const res = await fetch(`/api/search/students?q=${encodeURIComponent(q)}&tags=${encodeURIComponent(tags)}&page=${page}&pageSize=12`, { cache: "no-store" });
  const data = res.ok ? await res.json() : { items: [], total: 0, page: 1, pageSize: 12 };

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || 12)));

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">学生検索</h1>
        <a href="/dashboard" className="text-sm inline-flex items-center px-3 py-2 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">ダッシュボードへ戻る</a>
      </div>

      <form action="/search" className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input name="q" defaultValue={q} placeholder="キーワード（氏名/大学/自己紹介など）" className="border rounded px-3 py-2" />
        <input name="tags" defaultValue={tags} placeholder="タグ（カンマ区切り）" className="border rounded px-3 py-2" />
        <button className="border border-neutral-900 bg-neutral-900 text-white rounded px-4 py-2">検索</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(!data.items || data.items.length === 0) && (
          <p className="text-sm text-neutral-600">該当する学生が見つかりませんでした。</p>
        )}
        {data.items?.map((s: any) => (
          <div key={s.id} className="border rounded-xl bg-white overflow-hidden">
            <div className="aspect-video bg-black">
              {s.videos?.[0] ? (
                <video src={s.videos[0].videoUrl} controls className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500">動画なし</div>
              )}
            </div>
            <div className="p-3">
              <div className="font-medium">{s.fullName || "学生"}</div>
              <div className="text-sm text-neutral-600">{s.university || "学校名未設定"}</div>
              <div className="mt-2 flex justify-end">
                <a href="/swipe" className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">スワイプへ</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2">
        <a href={`/search?q=${encodeURIComponent(q)}&tags=${encodeURIComponent(tags)}&page=${Math.max(1, page - 1)}`} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">前へ</a>
        <span className="text-sm">{page} / {totalPages}</span>
        <a href={`/search?q=${encodeURIComponent(q)}&tags=${encodeURIComponent(tags)}&page=${Math.min(totalPages, page + 1)}`} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">次へ</a>
      </div>
    </main>
  );
}

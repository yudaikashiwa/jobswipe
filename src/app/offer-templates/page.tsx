import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function OfferTemplatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "COMPANY") redirect("/dashboard");

  const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3055"}/api/offer-templates`, { cache: "no-store" });
  const data = res.ok ? await res.json() : { templates: [] };

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">オファーテンプレート</h1>
        <a href="/dashboard" className="text-sm inline-flex items-center px-3 py-2 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">ダッシュボードへ戻る</a>
      </div>

      <form action={async (formData) => {
        "use server";
        const session = await auth();
        if (!session?.user || session.user.userType !== "COMPANY") return;
        const title = String(formData.get("title") || "").trim();
        const body = String(formData.get("body") || "").trim();
        if (!title || !body) return;
        await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3055"}/api/offer-templates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body }) });
        redirect("/offer-templates");
      }} className="space-y-3 border rounded-xl bg-white p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input name="title" placeholder="タイトル" className="border rounded px-3 py-2" />
          <textarea name="body" placeholder="本文" rows={3} className="border rounded px-3 py-2 md:col-span-2" />
        </div>
        <div className="flex justify-end">
          <button className="border border-neutral-900 bg-neutral-900 text-white rounded px-4 py-2">追加</button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.templates?.map((t: any) => (
          <div key={t.id} className="border rounded-xl bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{t.title}</div>
              <form action={async () => { "use server"; await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3055"}/api/offer-templates/${t.id}`, { method: "DELETE" }); redirect("/offer-templates"); }}>
                <button className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-neutral-900 text-neutral-900 hover:bg-neutral-100">削除</button>
              </form>
            </div>
            <div className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">{t.body}</div>
          </div>
        ))}
      </div>
    </main>
  );
}


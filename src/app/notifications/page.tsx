import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function markAllRead() {
  "use server";
  const session = await auth();
  if (!session?.user) return;
  await prisma.notification.updateMany({ where: { userId: session.user.id, readAt: null }, data: { readAt: new Date() } });
  redirect("/notifications?done=1");
}

export default async function NotificationsPage(props: { searchParams?: Promise<{ done?: string }> }) {
  const searchParams = (await props.searchParams) || {} as { done?: string };
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const done = searchParams?.done === "1";

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">通知</h1>
        <form action={markAllRead}><button className="text-sm inline-flex items-center px-3 py-2 rounded border border-neutral-900 text-neutral-900 hover:bg-neutral-100">すべて既読にする</button></form>
      </div>
      {done && (
        <div className="text-sm border border-green-200 bg-green-50 text-green-800 rounded px-3 py-2">すべて既読にしました</div>
      )}
      <ul className="space-y-3">
        {items.length === 0 && <li className="text-sm text-neutral-600">通知はありません。</li>}
        {items.map((n) => (
          <li key={n.id} className={`border rounded-xl bg-white p-4 ${n.readAt ? "opacity-70" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium">{n.title}</div>
              <div className="text-xs text-neutral-600">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            {n.body && <div className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">{n.body}</div>}
            {n.readAt ? (
              <div className="text-xs text-neutral-500 mt-2">既読</div>
            ) : (
              <form action={async () => { "use server"; await prisma.notification.update({ where: { id: n.id }, data: { readAt: new Date() } }); }}>
                <button className="text-xs underline mt-2">既読にする</button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

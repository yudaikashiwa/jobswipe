import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DeclinedOffersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "STUDENT") redirect("/offers");

  const offers = await prisma.offer.findMany({
    where: { studentId: session.user.id, status: "DECLINED" },
    orderBy: { createdAt: "desc" },
    include: { company: { select: { email: true } } },
  });

  async function acceptOffer(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    const id = String(formData.get("id"));
    await prisma.offer.update({ where: { id }, data: { status: "ACCEPTED" } });
    redirect("/chats" );
  }

  async function deleteOffer(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    const id = String(formData.get("id"));
    // 自分のDECLINEDのみ削除
    await prisma.offer.deleteMany({ where: { id, studentId: session.user.id, status: "DECLINED" } });
    redirect("/offers/declined");
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">辞退済みオファー</h1>
      <div className="grid grid-cols-1 gap-4">
        {offers.length === 0 && <p className="text-sm text-neutral-600">辞退済みのオファーはありません。</p>}
        {offers.map((o) => (
          <div key={o.id} className="border rounded-xl bg-white p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-neutral-600">{new Date(o.createdAt).toLocaleString()}</div>
              <div className="font-medium mt-1">送信元: {o.company?.email}</div>
              {o.message && <div className="text-sm mt-2 line-clamp-2">{o.message}</div>}
            </div>
            <div className="flex items-center gap-2">
              <form action={acceptOffer}>
                <input type="hidden" name="id" value={o.id} />
                <button className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-indigo-600 text-white bg-indigo-600 hover:bg-indigo-700">承諾する</button>
              </form>
              <form action={deleteOffer}>
                <input type="hidden" name="id" value={o.id} />
                <button className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-neutral-900 text-neutral-900 hover:bg-neutral-100">削除</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}


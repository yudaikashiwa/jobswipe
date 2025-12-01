import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OfferStatusButtons from "@/components/OfferStatusButtons";

export default async function OffersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  let offers: any[] = [];
  if (session.user.userType === "COMPANY") {
    const rows = await prisma.offer.findMany({
      where: { companyId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, email: true } } },
    });
    // 学生ごとに最新のみ
    const seen = new Set<string>();
    for (const o of rows) {
      const key = o.studentId;
      if (!seen.has(key)) {
        offers.push(o);
        seen.add(key);
      }
    }
  } else if (session.user.userType === "STUDENT") {
    const rows = await prisma.offer.findMany({
      where: { studentId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { company: { select: { id: true, email: true } } },
    });
    // その会社とのオファーに ACCEPTED が一つでもあれば、その会社のオファーは受信一覧に出さない
    const acceptedCompanies = new Set(rows.filter((o) => o.status === "ACCEPTED").map((o) => o.companyId));
    const filtered = rows.filter((o) => !acceptedCompanies.has(o.companyId));
    // 会社ごとに最新のみ
    const seen = new Set<string>();
    for (const o of filtered) {
      const key = o.companyId;
      if (!seen.has(key)) {
        offers.push(o);
        seen.add(key);
      }
    }
  }
  const isCompany = session.user.userType === "COMPANY";
  const isStudent = session.user.userType === "STUDENT";
  const statusLabel = (s: string) => ({ SENT: "送信済み", ACCEPTED: "承諾済み", DECLINED: "辞退済み" } as any)[s] || s;
  const statusStyle = (s: string) =>
    s === "SENT"
      ? "border-blue-200 text-blue-700 bg-blue-50"
      : s === "ACCEPTED"
      ? "border-green-200 text-green-700 bg-green-50"
      : "border-neutral-300 text-neutral-700 bg-neutral-50";
  const statusHint = (s: string) => {
    if (isCompany) {
      if (s === "SENT") return "学生の返信待ちです";
      if (s === "ACCEPTED") return "承諾されました。チャットで日程調整しましょう";
      return "辞退されました";
    }
    if (isStudent) {
      if (s === "SENT") return "対応待ちです。承諾または辞退を選択してください";
      if (s === "ACCEPTED") return "承諾済み。チャットでやり取りできます";
      return "辞退済み";
    }
    return "";
  };
  // 学生側: フォロー状態を取得
  let followSet: Set<string> = new Set();
  if (isStudent) {
    const follows = await prisma.follow.findMany({ where: { userId: session.user.id }, select: { companyId: true } });
    followSet = new Set(follows.map((f) => f.companyId));
  }

  async function follow(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    const companyId = String(formData.get("companyId"));
    await prisma.follow.create({ data: { userId: session.user.id, companyId } }).catch(() => {});
    redirect("/offers");
  }
  async function unfollow(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    const companyId = String(formData.get("companyId"));
    await prisma.follow.deleteMany({ where: { userId: session.user.id, companyId } });
    redirect("/offers");
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{isCompany ? "送信済みオファー" : isStudent ? "受信オファー" : "オファー"}</h1>
        {isStudent && (
          <a href="/offers/declined" className="text-sm inline-flex items-center px-3 py-2 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">辞退済みオファー</a>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4">
        {(!offers || offers.length === 0) && (
          <p className="text-sm text-neutral-600">オファーはまだありません。</p>
        )}
        {offers?.map((o: any) => (
          <div key={o.id} className="border rounded-xl bg-white p-4 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs text-neutral-600">{new Date(o.createdAt).toLocaleString()}</div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full border ${statusStyle(o.status)}`}>{statusLabel(o.status)}</span>
                <span className="text-xs text-neutral-600">{statusHint(o.status)}</span>
              </div>
              {o.message && (
                <div className="text-sm mt-2 line-clamp-2 text-neutral-800">{o.message}</div>
              )}
              {isCompany && <div className="text-sm text-neutral-600 mt-1">宛先: {o.student?.email}</div>}
              {isStudent && <div className="text-sm text-neutral-600 mt-1">送信元: {o.company?.email}</div>}
            </div>
            <div className="flex items-center gap-2">
              {isStudent && o.status === "SENT" && (
                <OfferStatusButtons offerId={o.id} />
              )}
              {isStudent && (
                followSet.has(o.companyId) ? (
                  <form action={unfollow}>
                    <input type="hidden" name="companyId" value={o.companyId} />
                    <button className="btn btn-outline">
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="mr-1">
                        <path d="M12 21s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0119 12c0 4.65-7 9-7 9z" fill="currentColor"/>
                      </svg>
                      フォロー解除
                    </button>
                  </form>
                ) : (
                  <form action={follow}>
                    <input type="hidden" name="companyId" value={o.companyId} />
                    <button className="btn btn-primary">
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="mr-1">
                        <path d="M12 21s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0119 12c0 4.65-7 9-7 9z" stroke="currentColor" strokeWidth="1.7" fill="none" />
                      </svg>
                      フォロー
                    </button>
                  </form>
                )
              )}
              <a href={`/chats/${o.id}`} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">チャットを開く</a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function FootprintsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "STUDENT") redirect("/dashboard");

  const rows = await prisma.footprint.findMany({
    where: {
      studentUserId: session.user.id,
      // オファー承諾済みの企業は除外（会社ユーザー→この学生のACCEPTEDが存在）
      NOT: {
        company: {
          sentOffers: {
            some: { studentId: session.user.id, status: "ACCEPTED" },
          },
        },
      },
    },
    orderBy: { lastViewedAt: "desc" },
    include: { company: { select: { id: true, email: true, companyProfile: true } } },
    take: 300,
  });

  const follows = await prisma.follow.findMany({ where: { userId: session.user.id }, select: { companyId: true } });
  const followSet = new Set(follows.map((f) => f.companyId));

  async function follow(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    const companyId = String(formData.get("companyId"));
    await prisma.follow.create({ data: { userId: session.user.id, companyId } }).catch(() => {});
    redirect("/footprints");
  }
  async function unfollow(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    const companyId = String(formData.get("companyId"));
    await prisma.follow.deleteMany({ where: { userId: session.user.id, companyId } });
    redirect("/footprints");
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">足あと</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rows.length === 0 && (
          <p className="text-sm text-neutral-600">まだ足あとがありません。</p>
        )}
        {rows.map((r) => {
          const p: any = (r.company as any).companyProfile;
          const name = p?.companyName || r.company.email;
          const website = p?.websiteUrl || null;
          const desc = p?.description || null;
          const following = followSet.has(r.company.id);
          return (
            <div key={r.id} className="border rounded-xl bg-white overflow-hidden">
              <a href={`/companies/${r.company.id}`} className="group block focus:outline-none focus:ring-2 focus:ring-indigo-600">
                <div className="aspect-[3/1] w-full bg-neutral-200 overflow-hidden">
                  {p?.coverUrl ? (
                    <img src={p.coverUrl} alt="cover" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="px-5 py-4">
                  <div className="min-w-0">
                    <div className="font-medium text-neutral-900 group-hover:underline break-all">{name}</div>
                    {desc && (
                      <div className="text-sm text-neutral-700 mt-3 line-clamp-3">{desc}</div>
                    )}
                  </div>
                </div>
              </a>
              <div className="px-5 pb-4 flex items-center justify-between">
                <div className="text-xs text-neutral-600 truncate">
                  {website ? (<a href={website} target="_blank" className="underline">{website}</a>) : <span className="opacity-70">Webサイト未設定</span>}
                </div>
                <div className="shrink-0">
                  {following ? (
                    <form action={unfollow}>
                      <input type="hidden" name="companyId" value={r.company.id} />
                      <button className="btn btn-outline">
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="mr-1">
                          <path d="M12 21s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0119 12c0 4.65-7 9-7 9z" fill="currentColor"/>
                        </svg>
                        フォロー解除
                      </button>
                    </form>
                  ) : (
                    <form action={follow}>
                      <input type="hidden" name="companyId" value={r.company.id} />
                      <button className="btn btn-primary">
                        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="mr-1">
                          <path d="M12 21s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0119 12c0 4.65-7 9-7 9z" stroke="currentColor" strokeWidth="1.7" fill="none" />
                        </svg>
                        フォロー
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

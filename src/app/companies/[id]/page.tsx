import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CompanyPublicPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "STUDENT") redirect("/dashboard");

  const company = await prisma.user.findUnique({ where: { id }, include: { companyProfile: true } });
  if (!company || company.userType !== "COMPANY") redirect("/companies");
  const p: any = (company as any).companyProfile;
  const companyId = company!.id;
  const follows = await prisma.follow.findFirst({ where: { userId: session.user.id, companyId } });
  const following = !!follows;

  async function follow() {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    const cid = companyId;
    await prisma.follow.create({ data: { userId: session.user.id, companyId: cid } }).catch(() => {});
    redirect(`/companies/${cid}`);
  }
  async function unfollow() {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    const cid = companyId;
    await prisma.follow.deleteMany({ where: { userId: session.user.id, companyId: cid } });
    redirect(`/companies/${cid}`);
  }

  return (
    <main className="p-6 space-y-6">
      <div className="relative">
        <div className="aspect-[3/1] w-full bg-neutral-200 overflow-hidden">
          {p?.coverUrl ? (
            <img src={p.coverUrl} alt="cover" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="absolute -bottom-6 left-4 h-16 w-16 rounded-full overflow-hidden border-2 border-white shadow bg-neutral-200">
          {p?.avatarUrl ? (
            <img src={p.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : null}
        </div>
      </div>
      <div className="flex items-center justify-between mt-8">
        <h1 className="text-2xl font-semibold">企業プロフィール</h1>
        <div className="flex items-center gap-2">
          <a href="/companies" className="text-sm inline-flex items-center px-3 py-2 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">一覧へ戻る</a>
          {following ? (
            <form action={unfollow}>
              <button className="btn btn-outline">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="mr-1">
                  <path d="M12 21s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0119 12c0 4.65-7 9-7 9z" fill="currentColor"/>
                </svg>
                フォロー解除
              </button>
            </form>
          ) : (
            <form action={follow}>
              <button className="btn btn-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="mr-1">
                  <path d="M12 21s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0119 12c0 4.65-7 9-7 9z" stroke="currentColor" strokeWidth="1.7" fill="none" />
                </svg>
                フォローする
              </button>
            </form>
          )}
        </div>
      </div>

      <section className="border rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="px-6 py-5 border-b bg-neutral-50 flex items-center gap-3">
          <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
          <h2 className="text-lg font-semibold">基本情報</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-bold text-indigo-700">企業名</span>
            <div className="mt-0.5 text-sm text-neutral-900">{p?.companyName || company.email}</div>
          </div>
          <div>
            <span className="text-sm font-bold text-indigo-700">業種</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {Array.isArray(p?.industries) && p.industries.length > 0 ? (
                p.industries.map((it: string, i: number) => (
                  <span key={`ind-${i}`} className="chip">{it}</span>
                ))
              ) : (
                <span className="text-sm text-neutral-700">{p?.industry || "未設定"}</span>
              )}
            </div>
            {p?.industryDisplay && (
              <div className="mt-1 text-sm text-neutral-800 whitespace-pre-wrap">{p.industryDisplay}</div>
            )}
          </div>
          {p?.location && (
            <div>
              <span className="text-sm font-bold text-indigo-700">所在地</span>
              <div className="mt-0.5 text-sm text-neutral-900">{p.location}{p.locationDetail ? ` ${p.locationDetail}` : ""}</div>
            </div>
          )}
          {p?.employeeCount && (
            <div>
              <span className="text-sm font-bold text-indigo-700">従業員数</span>
              <div className="mt-0.5 text-sm text-neutral-900">{p.employeeCount}名</div>
            </div>
          )}
          <div>
            <span className="text-sm font-bold text-indigo-700">Webサイト</span>
            <div className="mt-0.5 text-sm break-all text-neutral-900">{p?.websiteUrl ? <a href={p.websiteUrl} target="_blank" className="underline">{p.websiteUrl}</a> : "未設定"}</div>
          </div>
          <div className="md:col-span-2">
            <span className="text-sm font-bold text-indigo-700">説明</span>
            <div className="mt-0.5 text-sm whitespace-pre-wrap text-neutral-800">{p?.description || "なし"}</div>
          </div>
          {Array.isArray(p?.sections) && p.sections.length > 0 && (
            <div className="md:col-span-2 space-y-4">
              {p.sections.map((s: any, i: number) => (
                <div key={i}>
                  <span className="text-sm font-bold text-indigo-700">{s.title || `セクション${i + 1}`}</span>
                  {s.body ? (
                    <div className="mt-0.5 text-sm whitespace-pre-wrap text-neutral-800">{s.body}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

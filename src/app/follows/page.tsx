import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function FollowsPage(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = (await props.searchParams) || {};
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "STUDENT") redirect("/dashboard");

  const q = (typeof searchParams?.q === "string" ? searchParams?.q : "").trim();
  const industry = (typeof searchParams?.industry === "string" ? searchParams?.industry : "").trim();
  const minEmployees = Number((typeof searchParams?.min === "string" ? searchParams?.min : "").trim()) || undefined;
  const maxEmployees = Number((typeof searchParams?.max === "string" ? searchParams?.max : "").trim()) || undefined;
  const loc = (typeof searchParams?.loc === "string" ? searchParams?.loc : "").trim();

  const companyWhere: any = {};
  const and: any[] = [];
  if (q) {
    and.push({ OR: [
      { email: { contains: q } },
      { companyProfile: { is: { companyName: { contains: q } } } },
      { companyProfile: { is: { industry: { contains: q } } } },
    ] });
  }
  if (industry) and.push({ OR: [
    { companyProfile: { is: { industry: { contains: industry } } } },
    { companyProfile: { is: { industries: { array_contains: industry } } } },
  ] });
  if (minEmployees !== undefined) and.push({ companyProfile: { is: { employeeCount: { gte: minEmployees } } } });
  if (maxEmployees !== undefined) and.push({ companyProfile: { is: { employeeCount: { lte: maxEmployees } } } });
  if (loc) and.push({ companyProfile: { is: { location: loc } } });
  if (and.length > 0) companyWhere.AND = and;

  const rows = await prisma.follow.findMany({
    where: { userId: session.user.id, company: companyWhere },
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { id: true, email: true, companyProfile: true } },
    },
    take: 300,
  });

  async function unfollow(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user) return;
    const companyId = String(formData.get("companyId"));
    await prisma.follow.deleteMany({ where: { userId: session.user.id, companyId } });
    const qsp = new URLSearchParams({
      q: q || "",
      industry: industry || "",
      min: typeof minEmployees === "number" ? String(minEmployees) : "",
      max: typeof maxEmployees === "number" ? String(maxEmployees) : "",
    });
    const suffix = q || industry || minEmployees || maxEmployees ? `?${qsp.toString()}` : "";
    redirect(`/follows${suffix}`);
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">フォロー済みの企業</h1>
      </div>

      <form className="card p-4 grid grid-cols-1 md:grid-cols-5 gap-3" method="get">
        <div>
          <label className="label">キーワード</label>
          <input name="q" defaultValue={q} className="field" placeholder="企業名・ドメインなど" />
        </div>
        <div>
          <label className="label">業界</label>
          <input name="industry" defaultValue={industry} className="field" placeholder="例: IT, 小売" />
        </div>
        <div>
          <label className="label">所在地（都道府県）</label>
          <select name="loc" defaultValue={loc} className="field">
            <option value="">選択してください</option>
            {[
              "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
              "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
              "新潟県","富山県","石川県","福井県","山梨県","長野県",
              "岐阜県","静岡県","愛知県","三重県",
              "滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県",
              "鳥取県","島根県","岡山県","広島県","山口県",
              "徳島県","香川県","愛媛県","高知県",
              "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県",
              "沖縄県",
            ].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">従業員数(最小)</label>
          <input name="min" defaultValue={minEmployees ?? ""} className="field" inputMode="numeric" />
        </div>
        <div>
          <label className="label">従業員数(最大)</label>
          <input name="max" defaultValue={maxEmployees ?? ""} className="field" inputMode="numeric" />
        </div>
        <div className="md:col-span-5 flex justify-end gap-2">
          <a href="/follows" className="btn btn-outline">クリア</a>
          <button className="btn btn-primary">検索</button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rows.length === 0 && (
          <p className="text-sm text-neutral-600">該当する企業が見つかりませんでした。</p>
        )}
        {rows.map((r) => {
          const p: any = (r.company as any).companyProfile;
          const name = p?.companyName || r.company.email;
          const industries: string[] = Array.isArray(p?.industries) ? p.industries : (p?.industry ? [p.industry] : []);
          const industry = industries.length ? industries.join(" / ") : "業種未設定";
          const website = p?.websiteUrl || null;
          const desc = p?.description || null;
          const emp = p?.employeeCount || null;
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
                    <div className="text-sm text-neutral-600">{industry}{emp ? ` / 約${emp}名` : ""}</div>
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
                  <form action={unfollow}>
                    <input type="hidden" name="companyId" value={r.company.id} />
                    <button className="btn btn-outline">
                      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="mr-1">
                        <path d="M12 21s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0119 12c0 4.65-7 9-7 9z" fill="currentColor"/>
                      </svg>
                      フォロー解除
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

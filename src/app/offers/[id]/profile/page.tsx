import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function OfferProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) redirect("/offers");
  const me = session.user.id;
  const isParticipant = offer.companyId === me || offer.studentId === me;
  if (!isParticipant) redirect("/offers");

  const isCompanyViewer = me === offer.companyId;

  let studentProfile: any = null;
  let companyProfile: any = null;
  let isFollowing = false;

  if (isCompanyViewer) {
    studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: offer.studentId },
      include: { videos: { where: { isPublic: true }, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { uploadedAt: "desc" }] } },
    });
  } else {
    companyProfile = await prisma.companyProfile.findUnique({ where: { userId: offer.companyId } });
    // 学生側: フォロー状態
    const f = await prisma.follow.findFirst({ where: { userId: me, companyId: offer.companyId } });
    isFollowing = !!f;
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">相手のプロフィール</h1>
        <div className="flex items-center gap-2">
          <a href={`/offers/${offer.id}/chat`} className="text-sm inline-flex items-center px-3 py-2 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50">チャットへ戻る</a>
          <a href="/offers" className="text-sm inline-flex items-center px-3 py-2 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">オファー一覧へ戻る</a>
        </div>
      </div>

      {isCompanyViewer && studentProfile && (
        <section className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="border rounded-xl shadow-sm bg-white overflow-hidden">
            <div className="px-6 py-5 border-b bg-neutral-50 flex items-center gap-3">
              <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
              <h2 className="text-lg font-semibold">学生情報</h2>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border bg-neutral-100">
                  {studentProfile.avatarUrl && (
                    <img src={studentProfile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm font-bold text-indigo-700">氏名</span>
                <div className="mt-0.5 text-sm text-neutral-900">{studentProfile.fullName || "未設定"}</div>
              </div>
              <div>
                <span className="text-sm font-bold text-indigo-700">大学</span>
                <div className="mt-0.5 text-sm text-neutral-900">{studentProfile.university || "未設定"}</div>
              </div>
              <div>
                <span className="text-sm font-bold text-indigo-700">卒業年</span>
                <div className="mt-0.5 text-sm text-neutral-900">{studentProfile.graduationYear || "未設定"}</div>
              </div>
              <div>
                <span className="text-sm font-bold text-indigo-700">氏名（カナ）</span>
                <div className="mt-0.5 text-sm text-neutral-900">{studentProfile.nameKana || `${studentProfile.lastNameKana || ""}${studentProfile.firstNameKana || ""}` || "未設定"}</div>
              </div>
              <div>
                <span className="text-sm font-bold text-indigo-700">学年</span>
                <div className="mt-0.5 text-sm text-neutral-900">{studentProfile.grade || "未設定"}</div>
              </div>
              <div>
                <span className="text-sm font-bold text-indigo-700">性別</span>
                <div className="mt-0.5 text-sm text-neutral-900">{studentProfile.gender || "未設定"}</div>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-bold text-indigo-700">自己紹介</span>
                <div className="mt-0.5 text-sm whitespace-pre-wrap text-neutral-800">{studentProfile.bio || "なし"}</div>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-bold text-indigo-700">スキル・経験</span>
                <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-neutral-800">
                  <div>
                    <span className="text-xs font-semibold text-neutral-700">スキル</span>
                    <div className="text-sm text-neutral-900 mt-0.5 whitespace-pre-wrap">{studentProfile.skills || "なし"}</div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-700">経験</span>
                    <div className="text-sm text-neutral-900 mt-0.5 whitespace-pre-wrap">{studentProfile.experience || "なし"}</div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-700">プログラミング</span>
                    <div className="text-sm text-neutral-900 mt-0.5 whitespace-pre-wrap">{studentProfile.programmingSkills || "なし"}</div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-700">言語</span>
                    <div className="text-sm text-neutral-900 mt-0.5 whitespace-pre-wrap">{studentProfile.languageSkills || "なし"}</div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-xs font-semibold text-neutral-700">資格</span>
                    <div className="text-sm text-neutral-900 mt-0.5 whitespace-pre-wrap">{studentProfile.certifications || "なし"}</div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-bold text-indigo-700">学歴</span>
                <div className="mt-0.5 text-sm text-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><span className="text-sm font-bold text-indigo-700">学部（研究科）</span><div className="mt-0.5 text-sm text-neutral-900">{studentProfile.faculty || "未設定"}</div></div>
                  <div><span className="text-sm font-bold text-indigo-700">学科（専攻）</span><div className="mt-0.5 text-sm text-neutral-900">{studentProfile.department || "未設定"}</div></div>
                  <div><span className="text-sm font-bold text-indigo-700">ゼミ</span><div className="mt-0.5 text-sm text-neutral-900">{studentProfile.seminar || "未設定"}</div></div>
                  <div className="md:col-span-2"><span className="text-sm font-bold text-indigo-700">研究テーマ</span><div className="mt-0.5 text-sm text-neutral-900">{studentProfile.researchTheme || "未設定"}</div></div>
                </div>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-bold text-indigo-700">希望業界</span>
                <div className="mt-1 flex flex-wrap gap-2 text-sm">
                  {[studentProfile.desiredIndustry1, studentProfile.desiredIndustry2, studentProfile.desiredIndustry3]
                    .filter(Boolean)
                    .map((d: any, i: number) => (
                      <span key={`di-${i}`} className="chip">{d}</span>
                    ))}
                  {![studentProfile.desiredIndustry1, studentProfile.desiredIndustry2, studentProfile.desiredIndustry3].filter(Boolean).length && (
                    <span className="text-sm text-neutral-700">未設定</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {!isCompanyViewer && (
        <section className="border rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-6 py-5 border-b bg-neutral-50 flex items-center gap-3">
            <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
            <h2 className="text-lg font-semibold">企業情報</h2>
            <div className="ml-auto">
              {isFollowing ? (
                <form action={async () => { "use server"; const session = await auth(); if (!session?.user) return; await prisma.follow.deleteMany({ where: { userId: session.user.id, companyId: offer.companyId } }); }}>
                  <button className="btn btn-outline">
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="mr-1">
                      <path d="M12 21s-7-4.35-7-9a4 4 0 017-2.65A4 4 0 0119 12c0 4.65-7 9-7 9z" fill="currentColor"/>
                    </svg>
                    フォロー解除
                  </button>
                </form>
              ) : (
                <form action={async () => { "use server"; const session = await auth(); if (!session?.user) return; await prisma.follow.create({ data: { userId: session.user.id, companyId: offer.companyId } }); }}>
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
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden border bg-neutral-100">
                {companyProfile?.avatarUrl && <img src={companyProfile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />}
              </div>
            </div>
            <div>
              <span className="text-sm font-bold text-indigo-700">企業名</span>
              <div className="mt-0.5 text-sm text-neutral-900">{companyProfile?.companyName || "未設定"}</div>
            </div>
            <div>
              <span className="text-sm font-bold text-indigo-700">業種</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {Array.isArray((companyProfile as any)?.industries) && (companyProfile as any).industries.length > 0 ? (
                  ((companyProfile as any).industries as string[]).map((it, i) => (
                    <span key={`ci-${i}`} className="chip">{it}</span>
                  ))
                ) : (
                  <span className="text-sm text-neutral-700">{(companyProfile as any)?.industry || "未設定"}</span>
                )}
              </div>
              {(companyProfile as any)?.industryDisplay && (
                <div className="mt-1 text-sm text-neutral-800 whitespace-pre-wrap">{(companyProfile as any).industryDisplay}</div>
              )}
            </div>
            {(companyProfile as any)?.location && (
              <div>
                <span className="text-sm font-bold text-indigo-700">所在地</span>
                <div className="mt-0.5 text-sm text-neutral-900">{(companyProfile as any).location}{(companyProfile as any).locationDetail ? ` ${(companyProfile as any).locationDetail}` : ""}</div>
              </div>
            )}
            {companyProfile?.employeeCount && (
              <div>
                <span className="text-sm font-bold text-indigo-700">従業員数</span>
                <div className="mt-0.5 text-sm text-neutral-900">{companyProfile.employeeCount}名</div>
              </div>
            )}
            <div>
              <span className="text-sm font-bold text-indigo-700">Webサイト</span>
              <div className="mt-0.5 font-medium break-all text-neutral-900">{companyProfile?.websiteUrl ? <a href={companyProfile.websiteUrl} target="_blank" className="underline">{companyProfile.websiteUrl}</a> : "未設定"}</div>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-bold text-indigo-700">説明</span>
              <div className="mt-0.5 text-sm whitespace-pre-wrap text-neutral-800">{companyProfile?.description || "なし"}</div>
            </div>
            {Array.isArray(companyProfile?.sections) && companyProfile.sections.length > 0 && (
              <div className="md:col-span-2 space-y-4">
                {companyProfile.sections.map((s: any, i: number) => (
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
      )}
    </main>
  );
}

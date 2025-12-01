import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import OfferSendModal from "@/components/OfferSendModal";

export default async function StudentPublicProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      videos: { where: { isPublic: true }, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { uploadedAt: "desc" }] },
    },
  });
  if (!profile) redirect("/swipe");

  let hasOffered = false;
  if (session.user.userType === "COMPANY") {
    const existed = await prisma.offer.findFirst({ where: { companyId: session.user.id, studentId: profile.userId } });
    hasOffered = !!existed;
    // 足あとを記録（会社が学生プロフィールを閲覧）
    try {
      await prisma.footprint.upsert({
        where: { studentUserId_companyId: { studentUserId: profile.userId, companyId: session.user.id } },
        create: { studentUserId: profile.userId, companyId: session.user.id },
        update: { lastViewedAt: new Date() },
      });
    } catch {}
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">学生プロフィール</h1>
        <div className="flex items-center gap-2">
          {session.user.userType === "COMPANY" && (
            hasOffered ? (
              <span className="text-sm inline-flex items-center px-3 py-2 rounded border border-neutral-300 text-neutral-700">オファー送信済み</span>
            ) : (
              <OfferSendModal studentProfileId={profile.id} studentLabel={profile.fullName || "学生"} />
            )
          )}
          <a href="/swipe" className="text-sm inline-flex items-center px-3 py-2 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">スワイプへ戻る</a>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-6 py-5 border-b bg-neutral-50 flex items-center gap-3">
            <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
            <h2 className="text-lg font-semibold">基本情報</h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full overflow-hidden border bg-neutral-100">
                {profile.avatarUrl && <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" />}
              </div>
              <div>
                <div className="font-medium">{profile.fullName || "未設定"}</div>
                <div className="text-sm text-neutral-600">{profile.university || "学校名未設定"}</div>
              </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.nameKana && (
              <div><span className="text-sm text-neutral-600">氏名（カナ）</span><div className="font-medium">{profile.nameKana}</div></div>
            )}
            {profile.birthDate && (
              <div><span className="text-sm text-neutral-600">生年月日</span><div className="font-medium">{new Date(profile.birthDate).toLocaleDateString()}</div></div>
            )}
            {profile.grade && (
              <div><span className="text-sm text-neutral-600">学年</span><div className="font-medium">{profile.grade}</div></div>
            )}
            {profile.gender && (
              <div><span className="text-sm text-neutral-600">性別</span><div className="font-medium">{profile.gender}</div></div>
            )}
            {profile.postalCode && (
              <div><span className="text-sm text-neutral-600">郵便番号</span><div className="font-medium">{profile.postalCode}</div></div>
            )}
            {profile.address && (
              <div className="md:col-span-2"><span className="text-sm text-neutral-600">住所</span><div className="font-medium">{profile.address}</div></div>
            )}
            {profile.phone && (
              <div><span className="text-sm text-neutral-600">電話番号</span><div className="font-medium">{profile.phone}</div></div>
            )}
          </div>
          {profile.bio && (
            <div>
              <span className="text-sm text-neutral-600">自己紹介</span>
              <div className="text-sm whitespace-pre-wrap">{profile.bio}</div>
            </div>
          )}
            {profile.skills && (
              <div>
                <span className="text-sm text-neutral-600">スキル</span>
                <div className="text-sm whitespace-pre-wrap">{profile.skills}</div>
              </div>
            )}
            {profile.experience && (
              <div>
                <span className="text-sm text-neutral-600">経験</span>
                <div className="text-sm whitespace-pre-wrap">{profile.experience}</div>
              </div>
            )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.faculty && (<div><span className="text-sm text-neutral-600">学部（研究科）</span><div className="font-medium">{profile.faculty}</div></div>)}
            {profile.department && (<div><span className="text-sm text-neutral-600">学科（専攻）</span><div className="font-medium">{profile.department}</div></div>)}
            {profile.seminar && (<div><span className="text-sm text-neutral-600">ゼミ</span><div className="font-medium">{profile.seminar}</div></div>)}
            {profile.researchTheme && (<div className="md:col-span-2"><span className="text-sm text-neutral-600">研究テーマ</span><div className="text-sm">{profile.researchTheme}</div></div>)}
            {profile.artsOrScience && (<div><span className="text-sm text-neutral-600">理系/文系</span><div className="font-medium">{profile.artsOrScience}</div></div>)}
            {profile.graduationYear && (<div><span className="text-sm text-neutral-600">卒業予定年度</span><div className="font-medium">{profile.graduationYear}</div></div>)}
            {profile.highSchoolName && (<div className="md:col-span-2"><span className="text-sm text-neutral-600">出身高校名</span><div className="font-medium">{profile.highSchoolName}</div></div>)}
            {(profile.desiredIndustry1 || profile.desiredIndustry2 || profile.desiredIndustry3) && (
              <div className="md:col-span-2">
                <span className="text-sm text-neutral-600">希望業界</span>
                <div className="text-sm mt-1">
                  {[profile.desiredIndustry1, profile.desiredIndustry2, profile.desiredIndustry3].filter(Boolean).map((d, i) => (
                    <span key={i} className="inline-block mr-2 px-2 py-0.5 rounded bg-neutral-100 border">{d}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.programmingSkills && (
              <div className="md:col-span-2"><span className="text-sm text-neutral-600">プログラミング</span><div className="text-sm whitespace-pre-wrap">{profile.programmingSkills}</div></div>
            )}
            {profile.languageSkills && (
              <div className="md:col-span-2"><span className="text-sm text-neutral-600">言語</span><div className="text-sm whitespace-pre-wrap">{profile.languageSkills}</div></div>
            )}
            {profile.certifications && (
              <div className="md:col-span-2"><span className="text-sm text-neutral-600">資格</span><div className="text-sm whitespace-pre-wrap">{profile.certifications}</div></div>
            )}
          </div>
        </div>
        </div>
        <div className="lg:col-span-1 border rounded-xl shadow-sm bg-white overflow-hidden">
          <div className="px-6 py-5 border-b bg-neutral-50 flex items-center gap-3">
            <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
            <h2 className="text-lg font-semibold">公開動画</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            {profile.videos.length === 0 && <p className="text-sm text-neutral-600">公開動画はありません。</p>}
            {profile.videos.map((v) => (
              <div key={v.id} className="border rounded overflow-hidden">
                <div className="aspect-video bg-black">
                  <video src={v.videoUrl} controls className="w-full h-full" />
                </div>
                <div className="p-3">
                  <div className="font-medium flex items-center gap-2">{v.title}{(v as any).isFeatured ? <span className="text-xs border border-amber-600 text-amber-700 px-2 py-0.5 rounded">代表</span> : null}</div>
                  {v.description && <div className="text-sm text-neutral-600 mt-1 line-clamp-2">{v.description}</div>}
                  {Array.isArray(v.tags) && (v.tags as any[]).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(v.tags as any[]).map((t: any, i: number) => (
                        <span key={`${v.id}-tag-${i}`} className="text-xs px-2 py-0.5 rounded bg-neutral-100 border">{String(t)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

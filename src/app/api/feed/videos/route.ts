import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const tagsParam = (searchParams.get("tags") || "").trim();
  const university = (searchParams.get("university") || "").trim();
  const gradYearRaw = (searchParams.get("grad") || "").trim();
  const grade = (searchParams.get("grade") || "").trim();
  const gender = (searchParams.get("gender") || "").trim();
  const gradYear = gradYearRaw ? Number(gradYearRaw) : undefined;
  const tags = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // 既Like学生とSkip学生は原則除外するが、Like/Skip後に新しい動画があれば再表示
  const likes = await prisma.like.findMany({ where: { companyId: session.user.id }, select: { studentId: true, createdAt: true } });
  const likeMap = new Map<string, Date>();
  for (const l of likes) likeMap.set(l.studentId, l.createdAt);
  const skips = await prisma.skip.findMany({ where: { companyId: session.user.id }, select: { studentId: true, createdAt: true } });
  const skipMap = new Map<string, Date>();
  for (const s of skips) skipMap.set(s.studentId, s.createdAt);
  // 既にオファー済みの学生（ハートは押せない）
  const offers = await prisma.offer.findMany({ where: { companyId: session.user.id }, select: { studentId: true } });
  const offeredIds = Array.from(new Set(offers.map((o) => o.studentId)));

  // 候補を多めに取得し、アプリ側でフィルタ
  const where: any = {};
  const studentWhere: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { student: { OR: [
        { fullName: { contains: q } },
        { university: { contains: q } },
        { bio: { contains: q } },
        { skills: { contains: q } },
        { experience: { contains: q } },
      ] } },
    ];
  }
  if (tags.length > 0) {
    where.AND = (where.AND || []).concat([
      { OR: tags.map((t) => ({ tags: { array_contains: t } })) },
    ]);
  }
  if (university) studentWhere.university = { contains: university };
  if (typeof gradYear === "number" && Number.isFinite(gradYear)) studentWhere.graduationYear = gradYear;
  if (grade) studentWhere.grade = { contains: grade };
  if (gender) studentWhere.gender = { contains: gender };
  if (Object.keys(studentWhere).length > 0) {
    where.AND = (where.AND || []).concat([{ student: { is: studentWhere } }]);
  }

  const candidates = await prisma.video.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
    take: 200,
    include: { student: { select: { id: true, fullName: true, university: true, avatarUrl: true } } },
  });

  const filtered = candidates.filter((v) => {
    const likedAt = likeMap.get(v.studentId);
    const skippedAt = skipMap.get(v.studentId);
    // 表示可否: Like/Skipどちらも無ければ表示
    if (!likedAt && !skippedAt) return true;
    // どちらかの時刻より後に動画が更新されていれば表示
    const threshold = new Date(Math.max(likedAt?.getTime() ?? 0, skippedAt?.getTime() ?? 0));
    return v.uploadedAt > threshold;
  }).slice(0, 30);

  return NextResponse.json({ videos: filtered, offeredStudentIds: offeredIds });
}

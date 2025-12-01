import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const tagsParam = (searchParams.get("tags") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 12)));
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q } },
      { university: { contains: q } },
      { bio: { contains: q } },
      { skills: { contains: q } },
      { experience: { contains: q } },
    ];
  }

  const tags = tagsParam
    ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  if (tags.length > 0) {
    // 動画のタグにいずれかが含まれる学生
    where.videos = {
      some: {
        OR: tags.map((t) => ({ tags: { array_contains: t } })),
      },
    };
  }

  const [items, total] = await Promise.all([
    prisma.studentProfile.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { fullName: "asc" },
      include: { videos: { orderBy: { uploadedAt: "desc" }, take: 1 } },
    }),
    prisma.studentProfile.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}


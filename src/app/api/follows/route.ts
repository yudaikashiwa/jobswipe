import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { followCreateSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // 学生のみ（必要に応じて企業も許可）
  if (session.user.userType !== "STUDENT") return NextResponse.json({ follows: [] });

  const follows = await prisma.follow.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      company: { select: { id: true, email: true, companyProfile: true } },
    },
  });
  return NextResponse.json({ follows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = followCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { companyId } = parsed.data;

  // companyId は User.id（COMPANY）を想定
  try {
    await prisma.follow.create({ data: { userId: session.user.id, companyId } });
  } catch {}
  return NextResponse.json({ ok: true }, { status: 201 });
}


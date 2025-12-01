import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { likeCreateSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const likes = await prisma.like.findMany({
    where: { companyId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: { id: true, fullName: true, university: true, videos: { orderBy: { uploadedAt: "desc" }, take: 1 } }
      }
    }
  });

  return NextResponse.json({ likes });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = likeCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const { studentId } = parsed.data;

  try {
    await prisma.like.create({ data: { companyId: session.user.id, studentId } });
  } catch (e: any) {
    // unique制約違反は無視（既にいいね済み）
  }
  return NextResponse.json({ ok: true });
}


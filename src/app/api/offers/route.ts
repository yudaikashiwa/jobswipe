import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { offerCreateSchema } from "@/lib/validators";
import { sanitizeString } from "@/lib/sanitizer";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.userType === "COMPANY") {
    const offers = await prisma.offer.findMany({
      where: { companyId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, email: true } } },
    });
    return NextResponse.json({ offers });
  }
  if (session.user.userType === "STUDENT") {
    const offers = await prisma.offer.findMany({
      where: { studentId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { company: { select: { id: true, email: true } } },
    });
    return NextResponse.json({ offers });
  }
  return NextResponse.json({ offers: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = offerCreateSchema.safeParse({
    message: body?.message !== undefined ? sanitizeString(body?.message) : undefined,
    studentUserId: body?.studentUserId ? String(body.studentUserId) : undefined,
    studentProfileId: body?.studentProfileId ? String(body.studentProfileId) : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: parsed.error.flatten() }, { status: 400 });
  }

  const { message, studentUserId, studentProfileId } = parsed.data;

  let targetUserId: string | null = null;
  if (studentUserId) targetUserId = studentUserId;
  if (!targetUserId && studentProfileId) {
    const prof = await prisma.studentProfile.findUnique({ where: { id: studentProfileId }, select: { userId: true } });
    if (prof) targetUserId = prof.userId;
  }
  if (!targetUserId) return NextResponse.json({ error: "学生が見つかりません" }, { status: 404 });

  // 同一組み合わせでの重複を回避（一意運用）
  const existed = await prisma.offer.findFirst({ where: { companyId: session.user.id, studentId: targetUserId } });
  if (existed) {
    return NextResponse.json({ offer: existed, existed: true }, { status: 200 });
  }

  const offer = await prisma.offer.create({
    data: {
      companyId: session.user.id,
      studentId: targetUserId,
      message: message || "",
    },
  });

  // メッセージを送る仕様: オファー作成時に本文がある場合は最初のチャットメッセージとして保存
  if (message && message.trim().length > 0) {
    await prisma.message.create({
      data: {
        offerId: offer.id,
        senderId: session.user.id,
        receiverId: targetUserId,
        content: message,
      },
    });
  }

  // 学生向け通知: 新規オファー
  await prisma.notification.create({
    data: {
      userId: targetUserId,
      type: "OFFER_RECEIVED",
      title: "新しいオファーを受信しました",
      body: message,
      data: { offerId: offer.id, companyId: session.user.id },
    },
  });

  return NextResponse.json({ offer }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { offerStatusUpdateSchema } from "@/lib/validators";

export async function GET(_req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const offer = await prisma.offer.findUnique({ where: { id: params.id }, include: { company: true, student: true } });
  if (!offer) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  if (offer.companyId !== session.user.id && offer.studentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ offer });
}

export async function PATCH(req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offer = await prisma.offer.findUnique({ where: { id: params.id } });
  if (!offer) return NextResponse.json({ error: "Not Found" }, { status: 404 });
  if (offer.studentId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = offerStatusUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const updated = await prisma.offer.update({ where: { id: offer.id }, data: { status: parsed.data.status } });
  // 学生向け通知（自身宛て）: 承諾/辞退結果
  await prisma.notification.create({
    data: {
      userId: offer.studentId,
      type: "OFFER_STATUS",
      title: `オファーの状態: ${updated.status}`,
      body: updated.status === "ACCEPTED" ? "オファーを承諾しました" : "オファーを辞退しました",
      data: { offerId: updated.id },
    },
  });
  return NextResponse.json({ offer: updated });
}

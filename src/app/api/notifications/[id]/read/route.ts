import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(_req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.notification.updateMany({ where: { id: params.id, userId: session.user.id }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}

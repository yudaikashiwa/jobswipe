import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  // 自分が受信者で、かつ未読のメッセージ数
  const messages = await prisma.message.findMany({
    where: { receiverId: userId },
    select: { id: true },
  });
  const ids = messages.map((m) => m.id);
  if (ids.length === 0) return NextResponse.json({ unread: 0 });
  const reads = await prisma.messageRead.findMany({ where: { userId, messageId: { in: ids } }, select: { messageId: true } });
  const readSet = new Set(reads.map((r) => r.messageId));
  const unread = ids.filter((id) => !readSet.has(id)).length;
  return NextResponse.json({ unread });
}


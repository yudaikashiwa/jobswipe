import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { messageCreateSchema } from "@/lib/validators";
import { sanitizeString } from "@/lib/sanitizer";
import { ensureUploadDir as ensureChatDir } from "@/lib/upload";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

async function getOfferIfParticipant(offerId: string, userId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) return null;
  if (offer.companyId !== userId && offer.studentId !== userId) return null;
  return offer;
}

export async function GET(req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const offer = await getOfferIfParticipant(params.id, session.user.id);
  if (!offer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // スペック: 会社は送信済みでも閲覧可。学生も閲覧は可（返信は受託後）。

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || 50)));
  const q = (searchParams.get("q") || "").trim();
  const includeReads = searchParams.get("includeReads") === "1";

  // 互換: 過去に Offer.message に本文があり Message レコードが無い場合、最初のメッセージとして補完
  const msgCount = await prisma.message.count({ where: { offerId: offer.id } });
  if (msgCount === 0 && offer.message && offer.message.trim().length > 0) {
    try {
      await prisma.message.create({
        data: {
          offerId: offer.id,
          senderId: offer.companyId,
          receiverId: offer.studentId,
          content: offer.message,
        },
      });
    } catch {}
  }

  const where: any = { offerId: offer.id };
  if (q) where.content = { contains: q };

  const [items, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { sentAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: includeReads ? { reads: true } : undefined,
    }),
    prisma.message.count({ where }),
  ]);
  const messages = items.reverse();
  // 自分宛の未読を既読にする
  const toReadIds = messages.filter((m) => m.receiverId === session.user.id).map((m) => m.id);
  if (toReadIds.length) {
    const existing = await prisma.messageRead.findMany({ where: { userId: session.user.id, messageId: { in: toReadIds } }, select: { messageId: true } });
    const existsSet = new Set(existing.map((e) => e.messageId));
    const newIds = toReadIds.filter((id) => !existsSet.has(id));
    if (newIds.length) {
      await prisma.messageRead.createMany({ data: newIds.map((id) => ({ messageId: id, userId: session.user.id })) });
    }
  }
  // 既読判定（自分が送ったメッセージが相手に既読か）
  const otherId = session.user.id === offer.companyId ? offer.studentId : offer.companyId;
  const messagesWithFlags = includeReads
    ? (messages as any[]).map((m: any) => ({
        ...m,
        isReadByReceiver: m.senderId === session.user.id ? m.reads?.some((r: any) => r.userId === otherId) : undefined,
      }))
    : messages;

  return NextResponse.json({ messages: messagesWithFlags, total, page, pageSize });
}

// 簡易SSE: 定期的に最新メッセージを送る（dev用途）
export async function OPTIONS() {}

export async function POST(req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const offer = await getOfferIfParticipant(params.id, session.user.id);
  if (!offer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // スペック: 会社はSENT/ACCEPTEDで送信可、学生はACCEPTEDのみ送信可
  const isCompany = session.user.id === offer.companyId;
  const isStudent = session.user.id === offer.studentId;
  if (isStudent && offer.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Offer not accepted" }, { status: 403 });
  }
  const ctype = req.headers.get("content-type") || "";
  let content = "";
  let attachmentPath: string | undefined;
  let attachmentName: string | undefined;
  let attachmentType: string | undefined;
  if (ctype.includes("multipart/form-data")) {
    const form = await req.formData();
    content = sanitizeString(form.get("content") as any) || "";
    const file = form.get("file");
    if (file && typeof (file as any).arrayBuffer === "function") {
      await ensureChatDir();
      const anyFile = file as any as { name?: string; type?: string; arrayBuffer: () => Promise<ArrayBuffer> };
      const ext = path.extname(anyFile.name || "file.bin").slice(0, 10) || ".bin";
      const fname = `${crypto.randomUUID()}${ext}`;
      const out = path.join(process.cwd(), "public", "uploads", "videos", "..", "chat", fname);
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, Buffer.from(await anyFile.arrayBuffer()));
      attachmentPath = `/uploads/chat/${fname}`;
      attachmentName = anyFile.name || "file";
      attachmentType = anyFile.type || "application/octet-stream";
    }
  } else {
    const body = await req.json().catch(() => ({}));
    content = sanitizeString(body?.content) || "";
  }

  const parsed = messageCreateSchema.safeParse({ content });
  if (!parsed.success && !attachmentPath) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const senderId = session.user.id;
  const receiverId = senderId === offer.companyId ? offer.studentId : offer.companyId;

  const contentText = parsed.success ? parsed.data.content : "";
  const msg = await prisma.message.create({
    data: {
      offerId: offer.id,
      senderId,
      receiverId,
      content: contentText,
      attachmentUrl: attachmentPath,
      attachmentName,
      attachmentType,
    },
  });
  // 受信者(学生の場合もある)に通知
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: "MESSAGE_RECEIVED",
      title: "新しいメッセージ",
      body: contentText,
      data: { offerId: offer.id, messageId: msg.id },
    },
  });
  return NextResponse.json({ message: msg }, { status: 201 });
}

// タイピング表示
export async function PUT(req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const offer = await getOfferIfParticipant(params.id, session.user.id);
  if (!offer) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const until = new Date(Date.now() + 5000);
  await prisma.typingStatus.upsert({
    where: { offerId_userId: { offerId: offer.id, userId: session.user.id } },
    create: { offerId: offer.id, userId: session.user.id, until },
    update: { until },
  });
  return NextResponse.json({ ok: true });
}

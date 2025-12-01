import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ChatList from "@/components/ChatList";

export default async function ChatsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const uid = session.user.id;
  // 承諾済みオファーのみ
  const offers = await prisma.offer.findMany({
    where: { OR: [{ companyId: uid }, { studentId: uid }] },
    orderBy: { createdAt: "asc" },
  });

  // ペア（会社×学生）ごとに1チャットに集約（既存重複があっても最古のオファーを正とする）
  const pairMap = new Map<string, typeof offers[number]>();
  for (const o of offers) {
    const key = `C:${o.companyId}-S:${o.studentId}`;
    const existed = pairMap.get(key);
    // 優先: 非DECLINEDを優先して最古を採用。全てDECLINEDなら保持しない
    if (o.status !== "DECLINED") {
      if (!existed || existed.status === "DECLINED" || o.createdAt < existed.createdAt) {
        pairMap.set(key, o);
      }
    } else if (!existed) {
      // まだ何も入っていない場合は仮に入れる（後で非DECLINEDが来れば置換）
      pairMap.set(key, o);
    }
  }

  // 非DECLINEDのみを表示
  const canonicalOffers = Array.from(pairMap.values()).filter((o) => o.status !== "DECLINED");

  // N+1対策: 最新メッセージ/未読数/相手ユーザーをバッチで取得
  const offerIds = canonicalOffers.map((o) => o.id);
  const counterpartIds = Array.from(new Set(canonicalOffers.map((o) => (uid === o.companyId ? o.studentId : o.companyId))));

  // 最新メッセージ（各オファー毎の最大sentAtをgroupByし、そのセットで取得）
  const latestSentAtByOffer = offerIds.length
    ? await prisma.message.groupBy({
        by: ["offerId"],
        where: { offerId: { in: offerIds } },
        _max: { sentAt: true },
      })
    : [];
  const latestWhereOr = latestSentAtByOffer
    .filter((g) => g._max.sentAt)
    .map((g) => ({ offerId: g.offerId, sentAt: g._max.sentAt as Date }));
  const latestMessages = latestWhereOr.length
    ? await prisma.message.findMany({ where: { OR: latestWhereOr } })
    : [];
  const latestByOffer = new Map<string, (typeof latestMessages)[number]>();
  for (const m of latestMessages) {
    const existed = latestByOffer.get(m.offerId);
    if (!existed || existed.sentAt < m.sentAt) latestByOffer.set(m.offerId, m);
  }

  // 未読数: 受信者=自分のメッセージIDを全件取得→自分の既読を全件取得→差集合
  const receiverMsgs = offerIds.length
    ? await prisma.message.findMany({ where: { offerId: { in: offerIds }, receiverId: uid }, select: { id: true, offerId: true } })
    : [];
  const receiverMsgIds = receiverMsgs.map((m) => m.id);
  const reads = receiverMsgIds.length
    ? await prisma.messageRead.findMany({ where: { userId: uid, messageId: { in: receiverMsgIds } }, select: { messageId: true } })
    : [];
  const readSet = new Set(reads.map((r) => r.messageId));
  const unreadCountByOffer = new Map<string, number>();
  for (const m of receiverMsgs) {
    const isRead = readSet.has(m.id);
    if (!isRead) unreadCountByOffer.set(m.offerId, (unreadCountByOffer.get(m.offerId) || 0) + 1);
  }

  // 相手ユーザーのメール
  const counterparts = counterpartIds.length
    ? await prisma.user.findMany({
        where: { id: { in: counterpartIds } },
        select: {
          id: true,
          email: true,
          studentProfile: { select: { avatarUrl: true } },
          companyProfile: { select: { avatarUrl: true } },
        },
      })
    : [];
  const counterpartEmailById = new Map<string, string | null>(counterparts.map((u) => [u.id, u.email]));
  const counterpartAvatarById = new Map<string, string | null>(
    counterparts.map((u) => [u.id, (u as any).studentProfile?.avatarUrl || (u as any).companyProfile?.avatarUrl || null])
  );

  // 直近のメッセージが自分か（未返信判定用）
  const hasRepliedSet = new Set<string>();
  for (const [oid, msg] of latestByOffer.entries()) {
    if (!msg || msg.senderId === uid) {
      hasRepliedSet.add(oid);
    }
  }

  const list = canonicalOffers.map((o) => {
    const counterpartId = uid === o.companyId ? o.studentId : o.companyId;
    return {
      offer: o,
      latest: latestByOffer.get(o.id) || null,
      unread: unreadCountByOffer.get(o.id) || 0,
      counterpartEmail: counterpartEmailById.get(counterpartId) || null,
      counterpartAvatarUrl: counterpartAvatarById.get(counterpartId) || null,
      hasReplied: hasRepliedSet.has(o.id),
    };
  });
  return (
    <main className="p-6 space-y-6">
      <ChatList items={list as any} />
    </main>
  );
}

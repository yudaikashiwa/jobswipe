import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import OfferStatusButtons from "@/components/OfferStatusButtons";

export default async function ChatThreadPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const current = await prisma.offer.findUnique({ where: { id } });
  if (!current) redirect("/chats");
  if (current.companyId !== session.user.id && current.studentId !== session.user.id) redirect("/chats");
  // ペアの正規オファー（最古）へ正規化
  // ペア内の正規オファー: 非DECLINEDの最古。無ければチャット不可
  const canonical = await prisma.offer.findFirst({
    where: { companyId: current.companyId, studentId: current.studentId, NOT: { status: "DECLINED" } },
    orderBy: { createdAt: "asc" },
  });
  if (!canonical) redirect("/chats");
  const offer = canonical;
  if (offer.id !== current.id) redirect(`/chats/${offer.id}`);
  const canReply = session.user.id === offer.companyId || offer.status === "ACCEPTED";

  // トーク相手の表示名とアイコン
  let counterpartName = "";
  let counterpartAvatarUrl: string | null = null;
  if (session.user.id === offer.companyId) {
    const sp = await prisma.studentProfile.findUnique({
      where: { userId: offer.studentId },
      select: { fullName: true, avatarUrl: true },
    });
    counterpartName = sp?.fullName || "学生";
    counterpartAvatarUrl = sp?.avatarUrl || null;
  } else {
    const cp = await prisma.companyProfile.findUnique({
      where: { userId: offer.companyId },
      select: { companyName: true, avatarUrl: true },
    });
    counterpartName = cp?.companyName || "企業";
    counterpartAvatarUrl = cp?.avatarUrl || null;
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <a href={`/offers/${offer.id}/profile`} className="h-10 w-10 rounded-full overflow-hidden border bg-neutral-100 shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-600">
            {counterpartAvatarUrl ? (
              <img src={counterpartAvatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : null}
          </a>
          <h1 className="text-lg font-semibold truncate">{counterpartName}</h1>
        </div>
        <div className="flex items-center gap-2">
          {session.user.id === offer.studentId && offer.status === "SENT" && (
            <OfferStatusButtons offerId={offer.id} />
          )}
        </div>
      </div>
      <ChatWindow
        offerId={offer.id}
        selfId={session.user.id}
        canReply={canReply}
        acceptanceAt={offer.status === "ACCEPTED" ? (offer as any).updatedAt?.toISOString?.() || null : null}
      />
    </main>
  );
}

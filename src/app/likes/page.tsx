import { auth } from "@/auth";
import { redirect } from "next/navigation";
import OfferSendModal from "@/components/OfferSendModal";
import DeleteLikeButton from "@/components/DeleteLikeButton";
import { prisma } from "@/lib/prisma";

export default async function LikesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "COMPANY") redirect("/dashboard");

  // 会社が既にオファー済みの学生（ユーザー）を除外する
  const likesRaw = await prisma.like.findMany({
    where: { companyId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: {
          id: true,
          userId: true,
          fullName: true,
          university: true,
          videos: { orderBy: { uploadedAt: "desc" }, take: 1 },
        },
      },
    },
  });
  const offered = await prisma.offer.findMany({
    where: { companyId: session.user.id },
    select: { studentId: true },
  });
  const offeredUserSet = new Set(offered.map((o) => o.studentId));
  const likes = likesRaw.filter((l) => l.student && !offeredUserSet.has(l.student.userId));

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">気になるリスト</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(!likes || likes.length === 0) && (
          <p className="text-sm text-neutral-600">まだ「気になる」に追加した学生はいません。</p>
        )}
        {likes?.map((l: any) => (
          <div key={l.id} className="border rounded-xl overflow-hidden bg-white">
            <div className="aspect-video bg-black">
              {l.student?.videos?.[0] ? (
                <video src={l.student.videos[0].videoUrl} controls className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-500">動画なし</div>
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{l.student?.fullName || "学生"}</div>
                <div className="text-sm text-neutral-600">{l.student?.university || "学校名未設定"}</div>
              </div>
              <div className="flex items-center gap-2">
                <OfferSendModal studentProfileId={l.student?.id} studentLabel={l.student?.fullName || "学生"} />
                <DeleteLikeButton studentId={l.student?.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const offer = await prisma.offer.findUnique({ where: { id: params.id } });
  if (!offer) return new Response("Not Found", { status: 404 });
  if (offer.companyId !== session.user.id && offer.studentId !== session.user.id) return new Response("Forbidden", { status: 403 });
  // SENTでも閲覧のためストリーム許可（返信は受託後に制御）

  const { searchParams } = new URL(req.url);
  const last = searchParams.get("last") || "";
  let lastTime = last ? new Date(last) : new Date(0);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };
      const timer = setInterval(async () => {
        // new messages
        const msgs = await prisma.message.findMany({ where: { offerId: offer.id, sentAt: { gt: lastTime } }, orderBy: { sentAt: "asc" } });
        if (msgs.length) {
          lastTime = msgs[msgs.length - 1].sentAt;
          send("messages", msgs);
        }
        // typing
        const typings = await prisma.typingStatus.findMany({ where: { offerId: offer.id, until: { gt: new Date() } } });
        if (typings.length) send("typing", typings.map((t) => ({ userId: t.userId })));
      }, 2000);
      const ping = setInterval(() => {
        send("ping", { t: Date.now() });
      }, 15000);
      // close after 2 minutes to avoid leaks
      const killer = setTimeout(() => controller.close(), 120000);
      controller.enqueue(encoder.encode(`retry: 2000\n\n`));
      const cleanup = () => { clearInterval(timer); clearInterval(ping); clearTimeout(killer); };
      // @ts-ignore
      controller.error = cleanup;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

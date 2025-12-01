import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const studentId = String(body?.studentId || "");
  if (!studentId) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await prisma.skip.upsert({
    where: { companyId_studentId: { companyId: session.user.id, studentId } },
    create: { companyId: session.user.id, studentId },
    update: { createdAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}


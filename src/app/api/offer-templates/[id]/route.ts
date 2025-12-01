import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: any) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.offerTemplate.deleteMany({ where: { id: params.id, companyId: session.user.id } });
  return NextResponse.json({ ok: true });
}

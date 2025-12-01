import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.offerTemplate.findMany({ where: { companyId: session.user.id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ templates: items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const title = String(body?.title || "").trim();
  const bodyText = String(body?.body || "").trim();
  if (!title || !bodyText) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const created = await prisma.offerTemplate.create({ data: { companyId: session.user.id, title, body: bodyText } });
  return NextResponse.json({ template: created }, { status: 201 });
}


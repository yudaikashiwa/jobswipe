import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ videos: [] });

  const videos = await prisma.video.findMany({
    where: { studentId: profile.id },
    orderBy: [{ sortOrder: "asc" }, { uploadedAt: "desc" }],
  });
  return NextResponse.json({ videos });
}

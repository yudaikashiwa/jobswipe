import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { videoUploadSchema } from "@/lib/validators";
import { sanitizeString } from "@/lib/sanitizer";
import { ensureUploadDir, UPLOAD_DIR, extFromFilename } from "@/lib/upload";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const form = await req.formData();
    const blob = form.get("video");
    const rawTitle = sanitizeString(form.get("title") as any);
    const rawDesc = sanitizeString(form.get("description") as any) || null;
    const rawTags = sanitizeString((form.get("tags") as any) || "");

    // tags: comma-separated -> array
    const tags = rawTags
      ? rawTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => !!t)
          .slice(0, 10)
      : null;

    const parsed = videoUploadSchema.safeParse({ title: rawTitle, description: rawDesc, tags });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    // ファイル検証（Blob互換）
    if (!blob || typeof (blob as any).arrayBuffer !== "function") {
      return NextResponse.json({ error: "動画ファイルが必須です" }, { status: 400 });
    }
    const fileLike = blob as any as { size: number; type?: string; name?: string; arrayBuffer: () => Promise<ArrayBuffer> };

    const MAX_BYTES = 100 * 1024 * 1024; // 100MB に緩和
    if (fileLike.size > MAX_BYTES) {
      return NextResponse.json({ error: "ファイルサイズが大きすぎます(最大100MB)" }, { status: 400 });
    }
    const type = fileLike.type || "";
    const name = fileLike.name || "video.mp4";
    const ext = extFromFilename(name);
    const allowedExt = new Set([".mp4", ".mov", ".webm", ".m4v"]);
    const looksVideo = type.startsWith("video/") || allowedExt.has(ext);
    if (!looksVideo) return NextResponse.json({ error: "動画ファイルのみアップロードできます" }, { status: 400 });

    await ensureUploadDir();
    const id = crypto.randomUUID();
    const filename = `${id}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const arrayBuffer = await fileLike.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    // 学生プロフィールの取得/作成
    let profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
    if (!profile) {
      profile = await prisma.studentProfile.create({ data: { userId: session.user.id } });
    }

    const videoUrl = `/uploads/videos/${filename}`;
    // sortOrder: 末尾に追加
    const currentMax = await prisma.video.aggregate({ _max: { sortOrder: true }, where: { studentId: profile.id } });
    const nextOrder = (currentMax._max.sortOrder ?? 0) + 1;

    const video = await prisma.video.create({
      data: {
        studentId: profile.id,
        videoUrl,
        thumbnailUrl: null,
        title: parsed.data.title,
        description: parsed.data.description,
        tags: parsed.data.tags || undefined,
        sortOrder: nextOrder,
      },
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}

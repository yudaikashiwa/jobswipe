import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { videoUploadSchema } from "@/lib/validators";
import { sanitizeString } from "@/lib/sanitizer";
import { uploadToS3, generateS3Key } from "@/lib/s3";

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

    // ファイル検証
    if (!blob || typeof (blob as any).arrayBuffer !== "function") {
      return NextResponse.json({ error: "動画ファイルが必須です" }, { status: 400 });
    }
    const fileLike = blob as any as {
      size: number;
      type?: string;
      name?: string;
      arrayBuffer: () => Promise<ArrayBuffer>
    };

    const MAX_BYTES = 100 * 1024 * 1024; // 100MB
    if (fileLike.size > MAX_BYTES) {
      return NextResponse.json({ error: "ファイルサイズが大きすぎます(最大100MB)" }, { status: 400 });
    }

    const type = fileLike.type || "";
    if (!type.startsWith("video/")) {
      return NextResponse.json({ error: "動画ファイルのみアップロード可能です" }, { status: 400 });
    }

    // S3にアップロード
    const buffer = Buffer.from(await fileLike.arrayBuffer());
    const s3Key = generateS3Key(`videos/${session.user.id}`, fileLike.name || "video.mp4");
    const videoUrl = await uploadToS3(buffer, s3Key, type);

    // DBに保存
    const video = await prisma.video.create({
      data: {
        url: videoUrl,
        s3Key: s3Key, // S3キーも保存（削除時に必要）
        title: parsed.data.title,
        description: parsed.data.description,
        tags: parsed.data.tags,
        studentId: session.user.id,
      },
    });

    return NextResponse.json({ video });
  } catch (error) {
    console.error("Video upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
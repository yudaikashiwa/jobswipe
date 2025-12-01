import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import { UPLOAD_DIR, ensureUploadDir, extFromFilename } from "@/lib/upload";
import { videoUpdateSchema } from "@/lib/validators";
import { sanitizeString } from "@/lib/sanitizer";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: any
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const video = await prisma.video.findFirst({ where: { id: params.id, studentId: profile.id } });
  if (!video) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  // ファイル削除（存在しなくてもエラーにしない）
  try {
    const filename = path.basename(video.videoUrl);
    await fs.unlink(path.join(UPLOAD_DIR, filename));
  } catch {}

  await prisma.video.delete({ where: { id: video.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: any
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const video = await prisma.video.findFirst({ where: { id: params.id, studentId: profile.id } });
  if (!video) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  const ct = req.headers.get("content-type") || "";
  let title: string | undefined;
  let description: string | null | undefined;
  let tags: string[] | null | undefined;
  let newFile: { size: number; type?: string; name?: string; arrayBuffer: () => Promise<ArrayBuffer> } | null = null;

  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    title = form.get("title") !== null ? sanitizeString(form.get("title") as any) : undefined;
    const rawDesc = form.get("description") !== null ? sanitizeString(form.get("description") as any) : undefined;
    description = rawDesc === undefined ? undefined : rawDesc || null;
    const rawTags = form.get("tags") !== null ? sanitizeString(form.get("tags") as any) : undefined;
    tags = rawTags === undefined ? undefined : rawTags
      ? rawTags.split(",").map((t: string) => t.trim()).filter((t: string) => !!t).slice(0, 10)
      : null;
    const blob = form.get("video");
    if (blob && typeof (blob as any).arrayBuffer === "function") {
      newFile = blob as any;
    }
  } else {
    const json = await req.json().catch(() => ({}));
    title = json.title !== undefined ? sanitizeString(json.title) : undefined;
    description = json.description !== undefined ? (sanitizeString(json.description) || null) : undefined;
    tags = Array.isArray(json.tags)
      ? json.tags.map((t: unknown) => sanitizeString(String(t))).filter((t: string) => !!t)
      : undefined;
  }

  const parsed = videoUpdateSchema.safeParse({ title, description, tags });
  // isPublic, sortOrder (from either JSON or form when not provided remains undefined)
  if (!ct.includes("multipart/form-data")) {
    const json = await req.clone().json().catch(() => ({}));
    if (json && typeof json.isPublic === "boolean") (parsed as any).data.isPublic = json.isPublic;
    if (json && typeof json.sortOrder === "number") (parsed as any).data.sortOrder = json.sortOrder;
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data as any;

  // 新しい動画ファイルがあれば保存して差し替え
  let videoUrlUpdate: string | undefined;
  if (newFile) {
    const MAX_BYTES = 100 * 1024 * 1024;
    if (newFile.size > MAX_BYTES) {
      return NextResponse.json({ error: "ファイルサイズが大きすぎます(最大100MB)" }, { status: 400 });
    }
    const name = newFile.name || "video.mp4";
    const ext = extFromFilename(name);
    const allowedExt = new Set([".mp4", ".mov", ".webm", ".m4v"]);
    if (!allowedExt.has(ext)) {
      return NextResponse.json({ error: "サポートされていない拡張子です" }, { status: 400 });
    }
    await ensureUploadDir();
    const idNew = crypto.randomUUID();
    const filename = `${idNew}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const buf = Buffer.from(await newFile.arrayBuffer());
    await fs.writeFile(filePath, buf);

    // 旧ファイル削除（存在しなくても無視）
    try {
      const oldName = path.basename(video.videoUrl);
      await fs.unlink(path.join(UPLOAD_DIR, oldName));
    } catch {}

    videoUrlUpdate = `/uploads/videos/${filename}`;
  }

  const updated = await prisma.video.update({
    where: { id: video.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(videoUrlUpdate ? { videoUrl: videoUrlUpdate } : {}),
      ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      // メタ情報変更も最新として扱うため、更新時は uploadedAt を現在時刻に更新
      uploadedAt: new Date(),
    },
  });
  return NextResponse.json({ video: updated });
}

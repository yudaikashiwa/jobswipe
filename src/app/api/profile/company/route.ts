import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { companyProfileUpdateSchema } from "@/lib/validators";
import { sanitizeString } from "@/lib/sanitizer";
import { ensureAvatarDir, AVATAR_DIR, ensureCoverDir, COVER_DIR } from "@/lib/upload";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await prisma.companyProfile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "COMPANY") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const ctype = req.headers.get("content-type") || "";
  let data: any = {};
  let newAvatarPath: string | undefined;
  let newCoverPath: string | undefined;
  if (ctype.includes("multipart/form-data")) {
    const form = await req.formData();
    const cleaned = {
      companyName: sanitizeString(form.get("companyName") as any) || null,
      industry: sanitizeString(form.get("industry") as any) || null,
      websiteUrl: sanitizeString(form.get("websiteUrl") as any) || null,
      description: sanitizeString(form.get("description") as any) || null,
      location: sanitizeString(form.get("location") as any) || null,
      industryDisplay: sanitizeString(form.get("industryDisplay") as any) || null,
      locationDetail: sanitizeString(form.get("locationDetail") as any) || null,
      employeeCount: (() => {
        const raw = String(form.get("employeeCount") || "").trim();
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      })(),
      industries: (() => {
        const raw = form.get("industries");
        if (!raw) return null;
        try {
          const parsed = JSON.parse(String(raw));
          if (Array.isArray(parsed)) return parsed;
        } catch {}
        return null;
      })(),
      sections: (() => {
        const raw = form.get("sections");
        if (!raw) return null;
        try {
          const parsed = JSON.parse(String(raw));
          if (Array.isArray(parsed)) return parsed;
        } catch {}
        return null;
      })(),
    };
    const parsed = companyProfileUpdateSchema.safeParse(cleaned);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    data = parsed.data;
    if (!data.industries && data.industry) data.industries = [data.industry];
    const file = form.get("avatar");
    if (file && typeof (file as any).arrayBuffer === "function") {
      await ensureAvatarDir();
      const anyFile = file as any as { name?: string; type?: string; arrayBuffer: () => Promise<ArrayBuffer> };
      const type = (anyFile.type || "").toLowerCase();
      if (!type.startsWith("image/")) return NextResponse.json({ error: "画像ファイルを選択してください" }, { status: 400 });
      const ext = path.extname(anyFile.name || "avatar.png") || ".png";
      const fname = `${crypto.randomUUID()}${ext}`;
      const out = path.join(AVATAR_DIR, fname);
      await fs.writeFile(out, Buffer.from(await anyFile.arrayBuffer()));
      newAvatarPath = `/uploads/avatars/${fname}`;
      data.avatarUrl = newAvatarPath;
    }

    const cover = form.get("cover");
    if (cover && typeof (cover as any).arrayBuffer === "function") {
      await ensureCoverDir();
      const anyFile = cover as any as { name?: string; type?: string; arrayBuffer: () => Promise<ArrayBuffer> };
      const type = (anyFile.type || "").toLowerCase();
      if (!type.startsWith("image/")) return NextResponse.json({ error: "画像ファイルを選択してください" }, { status: 400 });
      const ext = path.extname(anyFile.name || "cover.jpg") || ".jpg";
      const fname = `${crypto.randomUUID()}${ext}`;
      const out = path.join(COVER_DIR, fname);
      await fs.writeFile(out, Buffer.from(await anyFile.arrayBuffer()));
      newCoverPath = `/uploads/covers/${fname}`;
      data.coverUrl = newCoverPath;
    }
  } else {
    const json = await req.json().catch(() => ({}));
    const cleaned = {
      companyName: sanitizeString(json.companyName) || null,
      industry: sanitizeString(json.industry) || null,
      websiteUrl: sanitizeString(json.websiteUrl) || null,
      description: sanitizeString(json.description) || null,
      location: sanitizeString(json.location) || null,
      industryDisplay: sanitizeString(json.industryDisplay) || null,
      locationDetail: sanitizeString(json.locationDetail) || null,
      employeeCount: typeof json.employeeCount === "number" ? json.employeeCount : (typeof json.employeeCount === "string" ? Number(json.employeeCount) : null),
      industries: Array.isArray(json.industries) ? json.industries : null,
      sections: Array.isArray(json.sections) ? json.sections : null,
    };
    const parsed = companyProfileUpdateSchema.safeParse(cleaned);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    data = parsed.data;
    if (!data.industries && data.industry) data.industries = [data.industry];
  }

  const current = await prisma.companyProfile.findUnique({ where: { userId: session.user.id } });
  if (current && newAvatarPath && current.avatarUrl && current.avatarUrl !== newAvatarPath) {
    try {
      const oldName = path.basename(current.avatarUrl);
      await fs.unlink(path.join(AVATAR_DIR, oldName));
    } catch {}
  }
  if (current && newCoverPath && current.coverUrl && current.coverUrl !== newCoverPath) {
    try {
      const oldName = path.basename(current.coverUrl);
      await fs.unlink(path.join(COVER_DIR, oldName));
    } catch {}
  }

  // industry(単一) 互換: industriesの先頭をindustryにも保存（旧表示用）
  if (data.industries && (!data.industry || data.industry !== data.industries[0])) {
    data.industry = data.industries[0] || null;
  }

  const upserted = await prisma.companyProfile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      ...data,
    },
  });

  return NextResponse.json({ profile: upserted });
}

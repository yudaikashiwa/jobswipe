import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { studentProfileUpdateSchema } from "@/lib/validators";
import { sanitizeString } from "@/lib/sanitizer";
import { ensureAvatarDir, AVATAR_DIR } from "@/lib/upload";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.userType !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ctype = req.headers.get("content-type") || "";
  let data: any = {};
  let newAvatarPath: string | undefined;
  if (ctype.includes("multipart/form-data")) {
    const form = await req.formData();
    const cleaned: any = {
      lastName: sanitizeString(form.get("lastName") as any) || null,
      firstName: sanitizeString(form.get("firstName") as any) || null,
      fullName: sanitizeString(form.get("fullName") as any) || null,
      lastNameKana: sanitizeString(form.get("lastNameKana") as any) || null,
      firstNameKana: sanitizeString(form.get("firstNameKana") as any) || null,
      nameKana: sanitizeString(form.get("nameKana") as any) || null,
      birthDate: sanitizeString(form.get("birthDate") as any) || null,
      grade: sanitizeString(form.get("grade") as any) || null,
      gender: sanitizeString(form.get("gender") as any) || null,
      postalCode: sanitizeString(form.get("postalCode") as any) || null,
      address: sanitizeString(form.get("address") as any) || null,
      phone: sanitizeString(form.get("phone") as any) || null,
      university: sanitizeString(form.get("university") as any) || null,
      faculty: sanitizeString(form.get("faculty") as any) || null,
      department: sanitizeString(form.get("department") as any) || null,
      seminar: sanitizeString(form.get("seminar") as any) || null,
      researchTheme: sanitizeString(form.get("researchTheme") as any) || null,
      artsOrScience: sanitizeString(form.get("artsOrScience") as any) || null,
      graduationYear: form.get("graduationYear") ? Number(form.get("graduationYear")) : null,
      highSchoolName: sanitizeString(form.get("highSchoolName") as any) || null,
      desiredIndustry1: sanitizeString(form.get("desiredIndustry1") as any) || null,
      desiredIndustry2: sanitizeString(form.get("desiredIndustry2") as any) || null,
      desiredIndustry3: sanitizeString(form.get("desiredIndustry3") as any) || null,
      bio: sanitizeString(form.get("bio") as any) || null,
      skills: sanitizeString(form.get("skills") as any) || null,
      experience: sanitizeString(form.get("experience") as any) || null,
      programmingSkills: sanitizeString(form.get("programmingSkills") as any) || null,
      languageSkills: sanitizeString(form.get("languageSkills") as any) || null,
      certifications: sanitizeString(form.get("certifications") as any) || null,
    };
    const parsed = studentProfileUpdateSchema.safeParse(cleaned);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    data = parsed.data;
    // 氏名の自動合成
    if ((data.lastName || data.firstName) && !data.fullName) {
      const fn = `${data.lastName || ""}${data.firstName ? ` ${data.firstName}` : ""}`.trim();
      if (fn) data.fullName = fn;
    }
    if ((data.lastNameKana || data.firstNameKana) && !data.nameKana) {
      const nk = `${data.lastNameKana || ""}${data.firstNameKana ? ` ${data.firstNameKana}` : ""}`.trim();
      if (nk) data.nameKana = nk;
    }
    if (data.birthDate) data.birthDate = new Date(data.birthDate as any);
    const file = form.get("avatar");
    if (file && typeof (file as any).arrayBuffer === "function") {
      const anyFile = file as any as { name?: string; type?: string; arrayBuffer: () => Promise<ArrayBuffer> };
      const type = (anyFile.type || "").toLowerCase();
      const ok = type.startsWith("image/");
      if (!ok) return NextResponse.json({ error: "画像ファイルを選択してください" }, { status: 400 });
      await ensureAvatarDir();
      const ext = path.extname(anyFile.name || "avatar.png") || ".png";
      const fname = `${crypto.randomUUID()}${ext}`;
      const out = path.join(AVATAR_DIR, fname);
      await fs.writeFile(out, Buffer.from(await anyFile.arrayBuffer()));
      newAvatarPath = `/uploads/avatars/${fname}`;
      data.avatarUrl = newAvatarPath;
    }
  } else {
    const json = await req.json().catch(() => ({}));
    const cleaned: any = {
      lastName: sanitizeString(json.lastName) || null,
      firstName: sanitizeString(json.firstName) || null,
      fullName: sanitizeString(json.fullName) || null,
      lastNameKana: sanitizeString(json.lastNameKana) || null,
      firstNameKana: sanitizeString(json.firstNameKana) || null,
      nameKana: sanitizeString(json.nameKana) || null,
      birthDate: sanitizeString(json.birthDate) || null,
      grade: sanitizeString(json.grade) || null,
      gender: sanitizeString(json.gender) || null,
      postalCode: sanitizeString(json.postalCode) || null,
      address: sanitizeString(json.address) || null,
      phone: sanitizeString(json.phone) || null,
      university: sanitizeString(json.university) || null,
      faculty: sanitizeString(json.faculty) || null,
      department: sanitizeString(json.department) || null,
      seminar: sanitizeString(json.seminar) || null,
      researchTheme: sanitizeString(json.researchTheme) || null,
      artsOrScience: sanitizeString(json.artsOrScience) || null,
      graduationYear: json.graduationYear,
      highSchoolName: sanitizeString(json.highSchoolName) || null,
      desiredIndustry1: sanitizeString(json.desiredIndustry1) || null,
      desiredIndustry2: sanitizeString(json.desiredIndustry2) || null,
      desiredIndustry3: sanitizeString(json.desiredIndustry3) || null,
      bio: sanitizeString(json.bio) || null,
      skills: sanitizeString(json.skills) || null,
      experience: sanitizeString(json.experience) || null,
      programmingSkills: sanitizeString(json.programmingSkills) || null,
      languageSkills: sanitizeString(json.languageSkills) || null,
      certifications: sanitizeString(json.certifications) || null,
    };
    const parsed = studentProfileUpdateSchema.safeParse(cleaned);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    data = parsed.data;
    if ((data.lastName || data.firstName) && !data.fullName) {
      const fn = `${data.lastName || ""}${data.firstName ? ` ${data.firstName}` : ""}`.trim();
      if (fn) data.fullName = fn;
    }
    if ((data.lastNameKana || data.firstNameKana) && !data.nameKana) {
      const nk = `${data.lastNameKana || ""}${data.firstNameKana ? ` ${data.firstNameKana}` : ""}`.trim();
      if (nk) data.nameKana = nk;
    }
    if (data.birthDate) data.birthDate = new Date(data.birthDate as any);
  }

  // 現在のプロフィール取得（古いアバター削除のため）
  const current = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (current && newAvatarPath && current.avatarUrl && current.avatarUrl !== newAvatarPath) {
    try {
      const oldName = path.basename(current.avatarUrl);
      await fs.unlink(path.join(AVATAR_DIR, oldName));
    } catch {}
  }

  const upserted = await prisma.studentProfile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json({ profile: upserted });
}

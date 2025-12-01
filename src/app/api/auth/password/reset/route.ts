import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { performPasswordResetSchema } from "@/lib/validators";
import { sanitizeString } from "@/lib/sanitizer";
import { hashToken } from "@/lib/tokens";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = {
      token: sanitizeString(body?.token),
      password: sanitizeString(body?.password),
    };
    const parsed = performPasswordResetSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json({ error: "入力が不正です", details: parsed.error.flatten() }, { status: 400 });
    }

    const { token, password } = parsed.data;
    const tokenHash = hashToken(token);

    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "リンクが無効または期限切れです" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: passwordHash } }),
      prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null, NOT: { tokenHash } } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requestPasswordResetSchema } from "@/lib/validators";
import { safeEmail } from "@/lib/sanitizer";
import { generateToken, hashToken } from "@/lib/tokens";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestPasswordResetSchema.safeParse({ email: safeEmail(body?.email) });
    if (!parsed.success) return NextResponse.json({ ok: true }); // 架空の成功で情報漏洩対策

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });

    if (user) {
      const token = generateToken(32);
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30分
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3055";
      const resetUrl = `${baseUrl}/reset-password/${token}`;
      const subject = "[JobSwipe] パスワード再設定のご案内";
      const text = `以下のURLからパスワードを再設定してください。\n\n${resetUrl}\n\nこのリンクは30分で失効します。`; 
      const html = `<p>以下のURLからパスワードを再設定してください。</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>このリンクは30分で失効します。</p>`;
      await sendMail({ to: user.email, subject, text, html });
    }

    // 常に成功レスポンス
    return NextResponse.json({ ok: true });
  } catch (e) {
    // 例外時も同一レスポンス
    return NextResponse.json({ ok: true });
  }
}

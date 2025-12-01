import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { safeEmail, sanitizeString } from "@/lib/sanitizer";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = {
      email: safeEmail(body?.email),
      password: sanitizeString(body?.password),
      userType: sanitizeString(body?.userType).toUpperCase()
    };

    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力値が不正です", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, userType } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "このメールは既に登録されています" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        userType: userType as any
      },
      select: { id: true, email: true, userType: true, createdAt: true }
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}


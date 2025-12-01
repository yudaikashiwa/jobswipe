import nodemailer from "nodemailer";

type SendMailParams = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export async function sendMail({ to, subject, html, text }: SendMailParams) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || "no-reply@example.com";

  if (!host || !port || !user || !pass) {
    // 開発中や未設定時はコンソールにリンクを出力
    // 本番では必ずSMTPを設定してください
    console.log("[sendMail:dev] to=", to, "subject=", subject);
    if (text) console.log(text);
    if (html) console.log(html);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({ from, to, subject, text, html });
}


// 簡易サニタイザ: 制御文字や不要なHTMLタグを除去
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim();
  // 文字参照やタグの除去（最低限）
  return trimmed
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/<[^>]*>/g, "");
}

export function safeEmail(input: unknown): string {
  const s = sanitizeString(input).toLowerCase();
  return s;
}


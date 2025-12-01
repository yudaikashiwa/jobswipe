import { promises as fs } from "fs";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "videos");

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function extFromFilename(name: string | undefined | null): string {
  const ext = name ? path.extname(name) : "";
  if (!ext) return ".mp4"; // デフォルト
  if (ext.length > 6) return ".mp4"; // 不正に長い拡張子は拒否
  return ext.toLowerCase();
}

export const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
export async function ensureAvatarDir() {
  await fs.mkdir(AVATAR_DIR, { recursive: true });
}

export const COVER_DIR = path.join(process.cwd(), "public", "uploads", "covers");
export async function ensureCoverDir() {
  await fs.mkdir(COVER_DIR, { recursive: true });
}

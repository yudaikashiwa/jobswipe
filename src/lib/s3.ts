import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

// S3クライアントの初期化
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "jobswipe";

// ファイル名生成
export function generateS3Key(prefix: string, originalName: string): string {
  const ext = originalName.split('.').pop() || 'mp4';
  const uniqueId = crypto.randomBytes(16).toString('hex');
  return `${prefix}/${uniqueId}.${ext}`;
}

// S3にファイルアップロード
export async function uploadToS3(
  file: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // パブリックURLまたは署名付きURLを返す
  return await getS3Url(key);
}

// S3から署名付きURLを取得（有効期限付き）
export async function getSignedS3Url(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

// パブリックURLを取得（バケットがパブリックの場合）
export async function getS3Url(key: string): Promise<string> {
  // 署名付きURLを使用（セキュアな方法）
  return await getSignedS3Url(key, 86400); // 24時間有効
}

// S3からファイル削除
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

// S3キーからフォルダとファイル名を分離
export function parseS3Key(url: string): string | null {
  // URLからS3キーを抽出
  const match = url.match(/(?:https?:\/\/)?[^\/]+\/(.+)/);
  return match ? match[1] : null;
}
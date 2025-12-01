import { z } from "zod";
import { COMPANY_INDUSTRIES, JAPAN_PREFECTURES } from "@/lib/constants";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  userType: z.enum(["STUDENT", "COMPANY"]) // ADMINは登録APIからは作らせない
});

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;

// 学生プロフィール更新
export const studentProfileUpdateSchema = z.object({
  lastName: z.string().trim().max(100).optional().nullable(),
  firstName: z.string().trim().max(100).optional().nullable(),
  fullName: z.string().trim().max(100).optional().nullable(),
  lastNameKana: z.string().trim().max(100).optional().nullable(),
  firstNameKana: z.string().trim().max(100).optional().nullable(),
  nameKana: z.string().trim().max(100).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  grade: z.string().trim().max(50).optional().nullable(),
  gender: z.string().trim().max(20).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  university: z.string().trim().max(200).optional().nullable(),
  faculty: z.string().trim().max(200).optional().nullable(),
  department: z.string().trim().max(200).optional().nullable(),
  seminar: z.string().trim().max(200).optional().nullable(),
  researchTheme: z.string().trim().max(500).optional().nullable(),
  artsOrScience: z.string().trim().max(20).optional().nullable(),
  graduationYear: z
    .union([z.number().int().min(1900).max(2100), z.string().regex(/^\d{4}$/).transform(Number)])
    .optional()
    .nullable(),
  highSchoolName: z.string().trim().max(200).optional().nullable(),
  desiredIndustry1: z.string().trim().max(200).optional().nullable(),
  desiredIndustry2: z.string().trim().max(200).optional().nullable(),
  desiredIndustry3: z.string().trim().max(200).optional().nullable(),
  bio: z.string().trim().max(5000).optional().nullable(),
  skills: z.string().trim().max(5000).optional().nullable(),
  experience: z.string().trim().max(5000).optional().nullable(),
  programmingSkills: z.string().trim().max(5000).optional().nullable(),
  languageSkills: z.string().trim().max(5000).optional().nullable(),
  certifications: z.string().trim().max(5000).optional().nullable(),
});

export type StudentProfileUpdateInput = z.infer<typeof studentProfileUpdateSchema>;

// 企業プロフィール更新
export const companyProfileUpdateSchema = z.object({
  companyName: z.string().trim().max(200).optional().nullable(),
  // 単一industryは後方互換のため緩めに受け付け（既存データに対応）。
  industry: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  industries: z
    .array(z.enum(COMPANY_INDUSTRIES as unknown as [string, ...string[]]))
    .min(0)
    .max(5)
    .optional()
    .nullable(),
  location: z
    .enum(JAPAN_PREFECTURES as unknown as [string, ...string[]])
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  locationDetail: z.string().trim().max(200).optional().nullable(),
  industryDisplay: z.string().trim().max(500).optional().nullable(),
  websiteUrl: z
    .string()
    .trim()
    .url()
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  description: z.string().trim().max(5000).optional().nullable(),
  employeeCount: z
    .union([z.number().int().min(1).max(1000000), z.string().regex(/^\d+$/).transform((v) => Number(v))])
    .optional()
    .nullable(),
  sections: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(100),
        body: z.string().trim().max(5000).optional().nullable(),
      })
    )
    .max(20)
    .optional()
    .nullable(),
});

export type CompanyProfileUpdateInput = z.infer<typeof companyProfileUpdateSchema>;

// パスワードリセット: 申請/実行
export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const performPasswordResetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type PerformPasswordResetInput = z.infer<typeof performPasswordResetSchema>;

// 動画アップロード
export const videoUploadSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(5000).optional().nullable(),
  tags: z
    .array(z.string().trim().min(1).max(20))
    .max(10)
    .optional()
    .nullable(),
});
export type VideoUploadInput = z.infer<typeof videoUploadSchema>;

export const videoUpdateSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(20)).max(10).optional().nullable(),
  isPublic: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export type VideoUpdateInput = z.infer<typeof videoUpdateSchema>;

// Like作成
export const likeCreateSchema = z.object({
  studentId: z.string().min(1),
});
export type LikeCreateInput = z.infer<typeof likeCreateSchema>;

// Follow 作成
export const followCreateSchema = z.object({
  companyId: z.string().min(1),
});
export type FollowCreateInput = z.infer<typeof followCreateSchema>;

// Offer
export const offerCreateSchema = z.object({
  // スワイプからはメッセージ無しで作成するため任意
  message: z.string().trim().max(5000).optional().nullable(),
  // どちらか一方を受け付ける
  studentUserId: z.string().min(1).optional(),
  studentProfileId: z.string().min(1).optional(),
}).refine((d) => !!d.studentUserId || !!d.studentProfileId, {
  message: "studentUserId または studentProfileId が必要です",
});

export const offerStatusUpdateSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
});

export type OfferCreateInput = z.infer<typeof offerCreateSchema>;
export type OfferStatusUpdateInput = z.infer<typeof offerStatusUpdateSchema>;

// Message
export const messageCreateSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;

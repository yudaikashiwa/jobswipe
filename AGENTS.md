# 【統合要件定義書】JobSwipe (MySQL/Prisma/AWS ver)

## 1. プロジェクト概要

### 1.1. アプリケーション名
JobSwipe (ジョブスワイプ)

### 1.2. コンセプト
「一人柄を可視化する就活版TikTok型 逆求人プラットフォーム」。学生が投稿した自己PR動画を企業がスワイプ形式で閲覧し、直感的にオファーを送れるWebアプリケーションを開発する。

### 1.3. 開発フェーズ
本要件定義は、**Phase 2: β版 (Webアプリ) 開発** に該当する。投資家や企業への実働デモとして、実際に運用可能なWebアプリケーションを構築する。

### 1.4. ターゲットユーザー
* **学生/求職者:** 学歴や資格だけでなく、自身の「人柄」や「雰囲気」で評価されたいZ世代のユーザー。
* **企業:** 面接前に候補者の雰囲気を把握し、採用の効率化とミスマッチの削減を目指す企業。

---

## 2. 開発ガイドライン (Agent.md準拠)

### 2.1. AIエージェントの役割
* 本システムは一部の機能実装や修正が必要な状態と想定し、開発を協力して進める。
* デザインの大幅な修正は行わず、指示に基づいた機能実装・修正を行う。
* 全ての回答と生成物は**日本語**で行う。

### 2.2. 作業プロセス
* 指示を受けたら、作業を開始する前に**何を行うか**を簡潔に説明し、許可を得てから作業を開始する。

### 2.3. デザイン原則
* **レスポンシブ対応**を必須とする。
* グラデーションは使用しない。
* 絵文字は（UI上では）使用しない。
* カラフルなデザインは避け、**洗練されたクリーンなデザイン**とする。

### 2.4. コーディング規約
* **言語:** TypeScript (strictモード)
* **スタイル:** Tailwind CSS (`src/app/globals.css`)
* **インデント:** 2スペース
* **パスエイリアス:** `@/*` → `src/*`
* **命名規則:**
    * コンポーネント: PascalCase (`ProjectSelector.tsx`)
    * 変数/関数: camelCase
    * 定数: UPPER_SNAKE_CASE
    * Next.jsルート: 小文字フォルダ + `page.tsx` / `route.ts`

### 2.5. セキュリティ方針
* IPAが定める「安全なウェブサイトの作り方」に準拠した対策を行う。
* APIの入力値は必ずバリデーションし、表示前にサニタイズ（`src/lib/sanitizer.ts` 等の共通処理を想定）する。
* `.gitignore` を適切に管理し、機密情報はコミットしない (`.env.local` を利用)。

---

## 3. 技術スタックとプロジェクト構成

### 3.1. 技術スタック
* **フロントエンド:** Next.js (App Router), React.js
* **バックエンド:** Next.js (API Routes), Node.js
* **データベース:** MySQL (Dockerでローカル環境を構築)
* **ORM:** Prisma
* **インフラ:** AWS (具体的なサービスは別途選定)
* **UI:** Tailwind CSS
* **テスト:** Playwright

### 3.2. プロジェクト構成
* `src/app` \UTF{2013} Next.js App Router（ページ、`app/api/*` のAPIルート）
* `src/components` \UTF{2013} 再利用可能なReactコンポーネント
* `src/lib` \UTF{2013} ユーティリティ（Prismaクライアント、認証、設定など）
* `prisma` \UTF{2013} `schema.prisma` と `seed.ts`
* `public` \UTF{2013} 静的アセット
* `tests` \UTF{2013} PlaywrightによるE2Eテスト

### 3.3. DB / Prisma 運用
* **ローカルDB起動:** `docker-compose up -d`
* **スキーマ変更後:** `npx prisma generate`
* **開発マイグレーション:** `npx prisma migrate dev`
* **本番反映:** `npx prisma migrate deploy`
* **シード実行:** `npm run db:seed`

---

## 4. 機能要件 (Phase 2)

### 4.1. ユーザー種別
* `STUDENT` (学生)
* `COMPANY` (企業)
* `ADMIN` (管理者)

### 4.2. 共通機能
* **アカウント登録:**
    * ユーザー種別（学生/企業）を選択。
    * メールアドレスとパスワードで登録 (パスワードはハッシュ化して保存)。
* **ログイン/ログアウト機能:**
    * セッション管理（Next-Auth.js または同様のライブラリ使用を推奨）。
* **パスワードリセット機能**

### 4.3. 学生向け機能 (`STUDENT`)
* **プロフィール登録・編集:** 基本情報、経歴、語学力、接客経験など。
* **動画投稿・管理:**
    * 60秒の自己紹介動画をアップロードできる (AWS S3等への保存を想定)。
    * 動画にはタイトル、説明文、タグ（例：「笑顔」「英語対応可」）を設定できる。
* **オファー閲覧:** オファーを受け取った企業の一覧とメッセージを表示。
* **チャット機能:** オファーをくれた企業とチャットでやり取り。

### 4.4. 企業向け機能 (`COMPANY`)
* **企業情報登録・編集:** 企業名、事業内容、ロゴなど。
* **動画スワイプ閲覧:**
    * 学生の動画を縦スワイプで閲覧。
    * 「気になる」（Like）/「スキップ」（Skip）操作。
* **学生検索機能:** タグで学生を検索。
* **「気になる」リスト:** 「気になる」にした学生を一覧表示。
* **オファー送信機能:** 「気になる」リストの学生にスカウトメッセージを送信。
* **チャット機能:** オファーを承諾した学生とチャット。

### 4.5. 管理者向け機能 (`ADMIN`)
* **管理ダッシュボード:**
    * 学生登録数、企業登録数、オファー数などの主要KPIを可視化。
* **ユーザー管理:** 学生、企業アカウントの一覧、編集、削除。
* **コンテンツ管理:** 不適切な動画の監視と削除。

---

## 5. データモデル (Prisma スキーマ)

`prisma/schema.prisma` に記述するスキーマ案です。

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: [https://pris.ly/d/prisma-schema](https://pris.ly/d/prisma-schema)

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String // ハッシュ化されたパスワード
  userType  UserType
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  studentProfile StudentProfile?
  companyProfile CompanyProfile?
  sentOffers     Offer[]         @relation("CompanySender")
  receivedOffers Offer[]         @relation("StudentReceiver")
  sentMessages   Message[]       @relation("Sender")
  receivedMessages Message[]     @relation("Receiver")
  likes          Like[]
}

enum UserType {
  STUDENT
  COMPANY
  ADMIN
}

model StudentProfile {
  id              String  @id @default(cuid())
  userId          String  @unique
  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName        String?
  university      String?
  graduationYear  Int?
  bio             String? @db.Text
  skills          String? @db.Text
  experience      String? @db.Text
  
  videos          Video[]
  receivedLikes   Like[]
}

model CompanyProfile {
  id           String  @id @default(cuid())
  userId       String  @unique
  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  companyName  String?
  industry     String?
  websiteUrl   String?
  description  String? @db.Text
}

model Video {
  id            String   @id @default(cuid())
  studentId     String
  student       StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  videoUrl      String // AWS S3のURL
  thumbnailUrl  String?
  title         String
  description   String?  @db.Text
  tags          Json? // 例: ["笑顔", "英語対応可"]
  uploadedAt    DateTime @default(now())
}

model Like {
  id        String   @id @default(cuid())
  companyId String
  company   User     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  studentId String
  student   StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([companyId, studentId]) // 会社は1人の学生に1回だけ「いいね」できる
}

model Offer {
  id        String     @id @default(cuid())
  companyId String
  company   User       @relation("CompanySender", fields: [companyId], references: [id], onDelete: Cascade)
  studentId String
  student   User       @relation("StudentReceiver", fields: [studentId], references: [id], onDelete: Cascade)
  message   String     @db.Text
  status    OfferStatus @default(SENT)
  createdAt DateTime   @default(now())
  
  messages  Message[]
}

enum OfferStatus {
  SENT
  ACCEPTED
  DECLINED
}

model Message {
  id         String   @id @default(cuid())
  offerId    String
  offer      Offer    @relation(fields: [offerId], references: [id], onDelete: Cascade)
  senderId   String
  sender     User     @relation("Sender", fields: [senderId], references: [id], onDelete: NoAction)
  receiverId String
  receiver   User     @relation("Receiver", fields: [receiverId], references: [id], onDelete: NoAction)
  content    String   @db.Text
  sentAt     DateTime @default(now())
}
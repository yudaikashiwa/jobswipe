/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // typedRoutes の新仕様に合わせて experimental からトップレベルへ移行。
  // 本プロジェクトでは動的APIルートの型注釈を柔軟に許容するため、ひとまず無効化。
  // 必要になれば true に戻し、各ルートの { params } 注釈を公式型に合わせて整備します。
  typedRoutes: false,
};

export default nextConfig;

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import VideoUploadForm from "@/components/VideoUploadForm";
import MyVideosList from "@/components/MyVideosList";

export default async function VideosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "STUDENT") redirect("/dashboard");

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">動画管理</h1>
        <a href="/dashboard" className="text-sm inline-flex items-center px-3 py-2 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">
          ダッシュボードへ戻る
        </a>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <VideoUploadForm />
        <MyVideosList />
      </div>
    </main>
  );
}

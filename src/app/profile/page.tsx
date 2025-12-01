import { auth } from "@/auth";
import { redirect } from "next/navigation";
import StudentProfileForm from "@/components/StudentProfileForm";
import CompanyProfileForm from "@/components/CompanyProfileForm";
import StudentProfileGuide from "@/components/StudentProfileGuide";
import CompanyProfileGuide from "@/components/CompanyProfileGuide";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">プロフィール編集</h1>
      {session.user.userType === "STUDENT" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><StudentProfileForm /></div>
          <aside className="lg:col-span-1"><StudentProfileGuide /></aside>
        </div>
      ) : session.user.userType === "COMPANY" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><CompanyProfileForm /></div>
          <aside className="lg:col-span-1"><CompanyProfileGuide /></aside>
        </div>
      ) : (
        <p>管理者はプロフィール編集対象外です。</p>
      )}
    </main>
  );
}

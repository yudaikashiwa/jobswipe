import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SwipeViewer from "@/components/SwipeViewer";

export default async function SwipePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.userType !== "COMPANY") redirect("/dashboard");

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">スワイプ</h1>
      <SwipeViewer />
    </main>
  );
}

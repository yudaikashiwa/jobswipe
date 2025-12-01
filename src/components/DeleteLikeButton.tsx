"use client";
import { useRouter } from "next/navigation";

export default function DeleteLikeButton({ studentId }: { studentId: string }) {
  const router = useRouter();
  const remove = async () => {
    await fetch(`/api/likes/${studentId}`, { method: "DELETE" });
    router.refresh();
  };
  return (
    <button onClick={remove} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-neutral-900 text-neutral-900 hover:bg-neutral-100">
      削除
    </button>
  );
}


"use client";
import { useRouter } from "next/navigation";

export default function OfferStatusButtons({ offerId }: { offerId: string }) {
  const router = useRouter();
  const update = async (status: "ACCEPTED" | "DECLINED") => {
    await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  };
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => update("ACCEPTED")} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-indigo-600 bg-indigo-600 text-white hover:opacity-90">承諾</button>
      <button onClick={() => update("DECLINED")} className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-neutral-900 text-neutral-900 hover:bg-neutral-100">辞退</button>
    </div>
  );
}


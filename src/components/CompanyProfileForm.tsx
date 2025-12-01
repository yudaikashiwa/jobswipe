"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { companyProfileUpdateSchema } from "@/lib/validators";
import { COMPANY_INDUSTRIES, JAPAN_PREFECTURES } from "@/lib/constants";

type CompanyProfile = {
  companyName: string | null;
  industry: string | null; // 互換
  industries: string[] | null;
  location: string | null;
  locationDetail: string | null;
  industryDisplay: string | null;
  websiteUrl: string | null;
  description: string | null;
  employeeCount: number | null;
  sections: { title: string; body?: string | null }[] | null;
};

export default function CompanyProfileForm() {
  const router = useRouter();
  const { data } = useSession();
  const [form, setForm] = useState<CompanyProfile>({
    companyName: null,
    industry: null,
    industries: [],
    location: null,
    locationDetail: null,
    industryDisplay: null,
    websiteUrl: null,
    description: null,
    employeeCount: null,
    sections: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const descCount = useMemo(() => (form.description?.length ?? 0), [form.description]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile/company", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.profile) {
          const p = data.profile as any;
          const allowed = new Set(COMPANY_INDUSTRIES as readonly string[]);
          setForm({
            ...form,
            ...p,
            employeeCount: p.employeeCount ?? null,
            sections: Array.isArray(p.sections) ? p.sections : [],
            industry: p.industry && allowed.has(p.industry) ? p.industry : (p.industry ? "その他" : null),
            industries: Array.isArray(p.industries)
              ? p.industries.filter((x: string) => allowed.has(x))
              : (p.industry && allowed.has(p.industry) ? [p.industry] : []),
            location: p.location ?? null,
            industryDisplay: p.industryDisplay ?? null,
          });
          if (p.coverUrl) setCoverPreview(p.coverUrl);
          if (p.avatarUrl) setAvatarPreview(p.avatarUrl);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (k: keyof CompanyProfile, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v === "" ? null : (k === "employeeCount" ? (v ? Number(v) : null) : (v as any)) }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrors({});

    const clientParsed = companyProfileUpdateSchema.safeParse(form);
    if (!clientParsed.success) {
      const f = clientParsed.error.flatten();
      setErrors(f.fieldErrors as Record<string, string[]>);
      setLoading(false);
      return;
    }
    let res: Response;
    if (avatarFile || coverFile) {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "sections") {
          fd.append("sections", JSON.stringify(v || []));
        } else if (k === "industries") {
          fd.append("industries", JSON.stringify(v || []));
        } else if (v !== null && v !== undefined) {
          fd.append(k, String(v));
        }
      });
        if (avatarFile) fd.append("avatar", avatarFile);
      if (coverFile) fd.append("cover", coverFile);
      res = await fetch("/api/profile/company", { method: "PUT", body: fd });
    } else {
      res = await fetch("/api/profile/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    if (res.ok) {
      try { alert("プロフィールの更新が成功しました"); } catch {}
      router.push("/profile");
      return;
    } else {
      const data = await res.json().catch(() => ({} as any));
      if (data?.details?.fieldErrors) setErrors(data.details.fieldErrors);
      setMessage("保存に失敗しました");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="border rounded-xl shadow-sm overflow-hidden bg-white">
        <div className="px-6 py-5 border-b bg-neutral-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
              <h2 className="text-lg font-semibold text-neutral-900">企業プロフィール</h2>
            </div>
            {data?.user?.email && (
              <div className="hidden md:flex items-center gap-2 text-sm text-neutral-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500"><path d="M4 4h16v16H4V4zm2 3l6 4 6-4" stroke="currentColor" strokeWidth="1.5"/></svg>
                <span>{data.user.email}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-neutral-600 mt-2">会社情報を入力してください。ロゴや画像は別途アップロード機能で対応予定です。</p>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-6 space-y-8 pb-28">
          {message && (
            <div className="text-sm border border-yellow-300 bg-yellow-50 text-neutral-800 rounded px-3 py-2">
              {message}
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-neutral-800">横長カバー画像</label>
                <div className="border rounded bg-neutral-100 overflow-hidden">
                  <div className="h-32 w-full bg-neutral-200">
                    {coverPreview ? (
                      <img src={coverPreview} alt="cover preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-neutral-500 text-sm">未設定</div>
                    )}
                  </div>
                  <div className="p-2 flex items-center justify-between text-xs text-neutral-600">
                    <span>推奨: 横長（例: 1200×400px 以上）</span>
                    <label className="btn btn-outline cursor-pointer">
                      画像を選択
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-neutral-800">ロゴ/顔写真</label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full overflow-hidden border bg-neutral-100">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar preview" className="h-full w-full object-cover" />
                    ) : (
                      // @ts-ignore
                      (form as any).avatarUrl ? (
                        // @ts-ignore
                        <img src={(form as any).avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                      ) : null
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">企業名</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V7l7-4 7 4v14" stroke="currentColor" strokeWidth="1.5"/></svg>
                  </span>
                  <input
                    className={`w-full border rounded pl-9 pr-3 py-2 focus:outline-none focus:ring-2 ${errors.companyName ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "focus:ring-indigo-600 focus:border-indigo-600"}`}
                    placeholder="例) 株式会社JobSwipe"
                    value={form.companyName ?? ""}
                    onChange={(e) => update("companyName", e.target.value)}
                  />
                </div>
                {errors.companyName && <p className="text-xs text-red-600 mt-1">{errors.companyName[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">業種（複数選択可）</label>
                <div className="grid grid-cols-2 gap-2">
                  {COMPANY_INDUSTRIES.map((opt) => {
                    const checked = (form.industries || []).includes(opt);
                    return (
                      <label key={opt} className={`flex items-center gap-2 border rounded px-3 py-2 cursor-pointer ${checked ? "bg-indigo-50 border-indigo-200" : "hover:bg-neutral-50"}`}>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={checked}
                          onChange={(e) => {
                            setForm((prev) => {
                              const cur = new Set(prev.industries || []);
                              if (e.target.checked) cur.add(opt); else cur.delete(opt);
                              return { ...prev, industries: Array.from(cur), industry: Array.from(cur)[0] || null };
                            });
                          }}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.industries && <p className="text-xs text-red-600 mt-1">{(errors.industries as any)[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">所在地（都道府県）</label>
                <select
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${errors.location ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "focus:ring-indigo-600 focus:border-indigo-600"}`}
                  value={form.location ?? ""}
                  onChange={(e) => update("location", e.target.value)}
                >
                  <option value="">選択してください</option>
                  {JAPAN_PREFECTURES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">所在地（詳細）</label>
                <input
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${errors.locationDetail ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "focus:ring-indigo-600 focus:border-indigo-600"}`}
                  placeholder="市区町村・丁目番地・建物名など"
                  value={form.locationDetail ?? ""}
                  onChange={(e) => update("locationDetail", e.target.value)}
                />
                {errors.locationDetail && <p className="text-xs text-red-600 mt-1">{errors.locationDetail[0]}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-neutral-800">学生向けに表示される業種（自由記述）</label>
                <input
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${errors.industryDisplay ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "focus:ring-indigo-600 focus:border-indigo-600"}`}
                  placeholder="例) ITコンサルティング / クラウドソリューション"
                  value={form.industryDisplay ?? ""}
                  onChange={(e) => update("industryDisplay", e.target.value)}
                />
                <p className="text-xs text-neutral-500 mt-1">未入力の場合は上の業種タグが学生向け画面に表示されます。</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">従業員数</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 ${errors.employeeCount ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "focus:ring-indigo-600 focus:border-indigo-600"}`}
                  placeholder="例) 120"
                  value={form.employeeCount ?? ""}
                  onChange={(e) => update("employeeCount", e.target.value)}
                />
                {errors.employeeCount && <p className="text-xs text-red-600 mt-1">{errors.employeeCount[0]}</p>}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">Webサイト</h3>
            <label className="block text-sm font-medium mb-1 text-neutral-800">WebサイトURL</label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21a9 9 0 100-18 9 9 0 000 18zm-8 0h16" stroke="currentColor" strokeWidth="1.5"/></svg>
              </span>
              <input
                className={`w-full border rounded pl-9 pr-3 py-2 focus:outline-none focus:ring-2 ${errors.websiteUrl ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "focus:ring-indigo-600 focus:border-indigo-600"}`}
                placeholder="https://example.com"
                value={form.websiteUrl ?? ""}
                onChange={(e) => update("websiteUrl", e.target.value)}
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">公式サイトや採用ページのURLをご記入ください。</p>
            {errors.websiteUrl && <p className="text-xs text-red-600 mt-1">{errors.websiteUrl[0]}</p>}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">会社説明</h3>
            <label className="block text-sm font-medium mb-1 text-neutral-800">説明</label>
            <textarea
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              rows={5}
              placeholder="事業内容、提供サービス、組織の雰囲気、求める人物像などを記載してください。"
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
            />
            <div className="text-xs text-neutral-500 mt-1">{descCount} / 5000</div>
            <div className="h-1 w-full bg-neutral-100 rounded">
              <div className="h-full bg-indigo-600 rounded" style={{ width: `${Math.min(100, Math.round((descCount/5000)*100))}%` }} />
            </div>
            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description[0]}</p>}
          </section>

          

          <section>
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">追加セクション</h3>
            <p className="text-xs text-neutral-600 mb-2">任意の見出しと本文を追加できます（例: 福利厚生・働き方・選考プロセス）。</p>
            <div className="space-y-4">
              {(form.sections || []).map((s, i) => (
                <div key={i} className="border rounded p-3 bg-neutral-50">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-neutral-800">見出し</label>
                      <input
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                        value={s.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            sections: (prev.sections || []).map((x, idx) => idx === i ? { ...x, title: v } : x),
                          }));
                        }}
                        placeholder="例) 福利厚生"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-neutral-800">本文</label>
                      <textarea
                        rows={3}
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                        value={s.body || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            sections: (prev.sections || []).map((x, idx) => idx === i ? { ...x, body: v } : x),
                          }));
                        }}
                        placeholder="制度や具体例など自由に記述"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" className="text-xs inline-flex items-center px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50" onClick={() => setForm((prev) => ({ ...prev, sections: (prev.sections || []).filter((_, idx) => idx !== i) }))}>削除</button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="text-sm inline-flex items-center px-3 py-1.5 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50" onClick={() => setForm((prev) => ({ ...prev, sections: [ ...(prev.sections || []), { title: "", body: "" } ] }))}>
                セクションを追加
              </button>
            </div>
          </section>

          <div className="h-2" />
          <div className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="mx-auto w-full max-w-3xl px-6 py-3 flex items-center justify-between">
              <p className="text-xs text-neutral-600 hidden sm:block">入力内容を確認して保存してください。</p>
              <div className="flex items-center gap-3">
                <a href="/dashboard" className="text-sm inline-flex items-center px-3 py-2 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">キャンセル</a>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center border border-indigo-600 bg-indigo-600 text-white rounded px-4 py-2 disabled:opacity-60 hover:bg-indigo-700"
                >
                  {loading ? "保存中..." : "保存"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

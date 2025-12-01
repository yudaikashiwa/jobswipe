"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { studentProfileUpdateSchema } from "@/lib/validators";
import { COMPANY_INDUSTRIES } from "@/lib/constants";

type StudentProfile = {
  lastName: string | null;
  firstName: string | null;
  fullName: string | null;
  lastNameKana: string | null;
  firstNameKana: string | null;
  nameKana: string | null;
  birthDate: string | null;
  grade: string | null;
  gender: string | null;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  university: string | null;
  faculty: string | null;
  department: string | null;
  seminar: string | null;
  researchTheme: string | null;
  artsOrScience: string | null;
  graduationYear: number | null;
  highSchoolName: string | null;
  desiredIndustry1: string | null;
  desiredIndustry2: string | null;
  desiredIndustry3: string | null;
  bio: string | null;
  skills: string | null;
  experience: string | null;
  programmingSkills: string | null;
  languageSkills: string | null;
  certifications: string | null;
};

export default function StudentProfileForm() {
  const GRADE_OPTIONS = [
    "学部1年",
    "学部2年",
    "学部3年",
    "学部4年",
    "学部5年",
    "学部6年",
    "修士1年",
    "修士2年",
    "博士1年",
    "博士2年",
    "博士3年",
  ];
  const currentYear = new Date().getFullYear();
  const GRAD_YEARS = Array.from({ length: 11 }, (_, i) => currentYear - 3 + i);
  const router = useRouter();
  const { data } = useSession();
  const [form, setForm] = useState<StudentProfile>({
    lastName: null,
    firstName: null,
    fullName: null,
    lastNameKana: null,
    firstNameKana: null,
    nameKana: null,
    birthDate: null,
    grade: null,
    gender: null,
    postalCode: null,
    address: null,
    phone: null,
    university: null,
    faculty: null,
    department: null,
    seminar: null,
    researchTheme: null,
    artsOrScience: null,
    graduationYear: null,
    highSchoolName: null,
    desiredIndustry1: null,
    desiredIndustry2: null,
    desiredIndustry3: null,
    bio: null,
    skills: null,
    experience: null,
    programmingSkills: null,
    languageSkills: null,
    certifications: null,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [zipLoading, setZipLoading] = useState(false);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);
  const bioCount = useMemo(() => (form.bio?.length ?? 0), [form.bio]);
  const skillsCount = useMemo(() => (form.skills?.length ?? 0), [form.skills]);
  const expCount = useMemo(() => (form.experience?.length ?? 0), [form.experience]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile/student", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) setForm({ ...form, ...data.profile });
        }
      } finally {
        setInitialLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (k: keyof StudentProfile, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v === "" ? null : v }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrors({});
    const payload = {
      ...form,
      graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
    } as any;

    const clientParsed = studentProfileUpdateSchema.safeParse(payload);
    if (!clientParsed.success) {
      const f = clientParsed.error.flatten();
      setErrors(f.fieldErrors as Record<string, string[]>);
      setLoading(false);
      return;
    }

    let res: Response;
    if (avatarFile) {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, String(v));
      });
      fd.append("avatar", avatarFile);
      res = await fetch("/api/profile/student", { method: "PUT", body: fd });
    } else {
      res = await fetch("/api/profile/student", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // 郵便番号から住所自動入力（zipcloud）
  const autofillAddress = async () => {
    const raw = form.postalCode || "";
    const zipcode = String(raw).replace(/[^0-9]/g, "");
    if (zipcode.length !== 7) return;
    try {
      setZipLoading(true);
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zipcode}`);
      const data = await res.json();
      if (data && data.status === 200 && Array.isArray(data.results) && data.results.length > 0) {
        const r = data.results[0];
        const addr = `${r.address1 || ""}${r.address2 || ""}${r.address3 || ""}`;
        if (addr) setForm((prev) => ({ ...prev, address: addr }));
      }
    } catch {
      // ignore
    } finally {
      setZipLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="border rounded-xl shadow-sm overflow-hidden bg-white">
        <div className="px-6 py-5 border-b bg-neutral-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-block h-5 w-1.5 rounded-full bg-indigo-600" />
              <h2 className="text-lg font-semibold text-neutral-900">学生プロフィール</h2>
            </div>
            {data?.user?.email && (
              <div className="hidden md:flex items-center gap-2 text-sm text-neutral-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-neutral-500"><path d="M4 4h16v16H4V4zm2 3l6 4 6-4" stroke="currentColor" strokeWidth="1.5"/></svg>
                <span>{data.user.email}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-neutral-600 mt-2">氏名や学歴、自己紹介などを入力してください。</p>
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
                <label className="block text-sm font-medium mb-1 text-neutral-800">顔写真</label>
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
            {initialLoading ? (
              <>
                <div className="animate-pulse h-10 bg-neutral-100 rounded" />
                <div className="animate-pulse h-10 bg-neutral-100 rounded" />
                <div className="animate-pulse h-10 bg-neutral-100 rounded md:col-span-1" />
              </>
            ) : (
              <>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">氏名（姓・名）</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 1114 0H5z" stroke="currentColor" strokeWidth="1.5"/></svg>
                  </span>
                  <div className="grid grid-cols-2 gap-2 pl-9">
                    <input
                      className={`w-full border rounded pr-3 py-2 focus:outline-none focus:ring-2 ${errors.lastName ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "focus:ring-indigo-600 focus:border-indigo-600"}`}
                      placeholder="例) 山田"
                      value={form.lastName ?? ""}
                      onChange={(e) => update("lastName", e.target.value)}
                    />
                    <input
                      className={`w-full border rounded pr-3 py-2 focus:outline-none focus:ring-2 ${errors.firstName ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "focus:ring-indigo-600 focus:border-indigo-600"}`}
                      placeholder="例) 太郎"
                      value={form.firstName ?? ""}
                      onChange={(e) => update("firstName", e.target.value)}
                    />
                  </div>
                </div>
              {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">大学</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 7l9-4 9 4-9 4L3 7zm0 6l9 4 9-4" stroke="currentColor" strokeWidth="1.5"/></svg>
                  </span>
                  <input
                    className={`w-full border rounded pl-9 pr-3 py-2 focus:outline-none focus:ring-2 ${errors.university ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "focus:ring-indigo-600 focus:border-indigo-600"}`}
                    placeholder="例) Job大学 経済学部"
                    value={form.university ?? ""}
                    onChange={(e) => update("university", e.target.value)}
                  />
                </div>
                {errors.university && <p className="text-xs text-red-600 mt-1">{errors.university[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">卒業年</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 5h18M3 12h18M3 19h18" stroke="currentColor" strokeWidth="1.5"/></svg>
                  </span>
                  <select
                    className={`w-full border rounded pl-9 pr-3 py-2 focus:outline-none focus:ring-2 ${errors.graduationYear ? "border-red-500 focus:ring-red-600 focus:border-red-600" : "focus:ring-indigo-600 focus:border-indigo-600"}`}
                    value={form.graduationYear ?? ""}
                    onChange={(e) => update("graduationYear", e.target.value)}
                  >
                    <option value="">選択してください</option>
                    {GRAD_YEARS.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                    {form.graduationYear && !GRAD_YEARS.includes(Number(form.graduationYear)) && (
                      <option value={String(form.graduationYear)}>{form.graduationYear}</option>
                    )}
                  </select>
                </div>
                {errors.graduationYear && <p className="text-xs text-red-600 mt-1">{errors.graduationYear[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">氏名（カナ）</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="ヤマダ"
                    value={form.lastNameKana ?? ""}
                    onChange={(e) => update("lastNameKana", e.target.value)}
                  />
                  <input
                    className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                    placeholder="タロウ"
                    value={form.firstNameKana ?? ""}
                    onChange={(e) => update("firstNameKana", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">生年月日</label>
                <input type="date" className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600" value={form.birthDate ?? ""} onChange={(e) => update("birthDate", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">学年</label>
                <select
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  value={form.grade ?? ""}
                  onChange={(e) => update("grade", e.target.value)}
                >
                  <option value="">選択してください</option>
                  {GRADE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  {/* 既存データに選択肢外の値がある場合の一時保持 */}
                  {form.grade && !GRADE_OPTIONS.includes(form.grade) && (
                    <option value={form.grade}>{form.grade}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">性別</label>
                <select className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600" value={form.gender ?? ""} onChange={(e) => update("gender", e.target.value)}>
                  <option value="">選択してください</option>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              </>
            )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">現住所</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">郵便番号</label>
                <div className="flex items-center gap-2">
                  <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600" value={form.postalCode ?? ""} onChange={(e) => update("postalCode", e.target.value)} placeholder="例) 123-4567" />
                  <button type="button" onClick={autofillAddress} disabled={zipLoading || !(form.postalCode || '').replace(/[^0-9]/g, '').match(/^\d{7}$/)} className="text-xs border rounded px-2 py-1 border-indigo-600 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60">
                    {zipLoading ? "検索中" : "住所自動入力"}
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-neutral-800">住所</label>
                <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600" value={form.address ?? ""} onChange={(e) => update("address", e.target.value)} />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1 text-neutral-800">電話番号</label>
                <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600" placeholder="例) 090-1234-5678" value={form.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">自己紹介</h3>
            <label className="block text-sm font-medium mb-1 text-neutral-800">自己紹介</label>
            <textarea
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
              rows={5}
              placeholder="あなたの強みや関心分野、活動などを具体的に記載してください。"
              value={form.bio ?? ""}
              onChange={(e) => update("bio", e.target.value)}
            />
            <div className="text-xs text-neutral-500 mt-1">{bioCount} / 5000</div>
            <div className="h-1 w-full bg-neutral-100 rounded">
              <div className="h-full bg-indigo-600 rounded" style={{ width: `${Math.min(100, Math.round((bioCount/5000)*100))}%` }} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">スキル・経験</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">スキル</label>
                <textarea
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  rows={4}
                  placeholder="例) 接客、英会話、動画編集、イベント運営"
                  value={form.skills ?? ""}
                  onChange={(e) => update("skills", e.target.value)}
                />
                <div className="text-xs text-neutral-500 mt-1">{skillsCount} / 5000</div>
                <div className="h-1 w-full bg-neutral-100 rounded">
                  <div className="h-full bg-indigo-600 rounded" style={{ width: `${Math.min(100, Math.round((skillsCount/5000)*100))}%` }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">経験</label>
                <textarea
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  rows={4}
                  placeholder="例) カフェ店員2年、学園祭実行委員、長期インターン"
                  value={form.experience ?? ""}
                  onChange={(e) => update("experience", e.target.value)}
                />
                <div className="text-xs text-neutral-500 mt-1">{expCount} / 5000</div>
                <div className="h-1 w-full bg-neutral-100 rounded">
                  <div className="h-full bg-indigo-600 rounded" style={{ width: `${Math.min(100, Math.round((expCount/5000)*100))}%` }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1 text-neutral-800">プログラミング</label>
                <textarea className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" rows={4} placeholder="例) JavaScript/TypeScript、React、Python" value={form.programmingSkills ?? ""} onChange={(e) => update("programmingSkills", e.target.value)} />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1 text-neutral-800">言語</label>
                <textarea className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" rows={4} placeholder="例) 日本語（母国語）、英語（TOEIC 800）" value={form.languageSkills ?? ""} onChange={(e) => update("languageSkills", e.target.value)} />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium mb-1 text-neutral-800">資格</label>
                <textarea className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" rows={4} placeholder="例) TOEIC 800、日商簿記2級、基本情報技術者" value={form.certifications ?? ""} onChange={(e) => update("certifications", e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">学歴</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">学部（研究科）</label>
                <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="例) 経済学部 / 工学研究科" value={form.faculty ?? ""} onChange={(e) => update("faculty", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">学科（専攻）</label>
                <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="例) 経済学科 / 情報工学専攻" value={form.department ?? ""} onChange={(e) => update("department", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">ゼミ</label>
                <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="例) マーケティング論ゼミ" value={form.seminar ?? ""} onChange={(e) => update("seminar", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-neutral-800">研究テーマ</label>
                <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="例) SNSマーケにおけるUGC分析" value={form.researchTheme ?? ""} onChange={(e) => update("researchTheme", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">理系/文系</label>
                <select className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={form.artsOrScience ?? ""} onChange={(e) => update("artsOrScience", e.target.value)}>
                  <option value="">選択してください</option>
                  <option value="理系">理系</option>
                  <option value="文系">文系</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-neutral-800">出身高校名</label>
                <input className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="例) Job高校" value={form.highSchoolName ?? ""} onChange={(e) => update("highSchoolName", e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-indigo-700 mb-3">希望業界</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">第一希望</label>
                <select className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={form.desiredIndustry1 ?? ""} onChange={(e) => update("desiredIndustry1", e.target.value)}>
                  <option value="">選択してください</option>
                  {COMPANY_INDUSTRIES.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">第二希望</label>
                <select className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={form.desiredIndustry2 ?? ""} onChange={(e) => update("desiredIndustry2", e.target.value)}>
                  <option value="">選択してください</option>
                  {COMPANY_INDUSTRIES.map((opt) => (
                    <option key={`2-${opt}`} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800">第三希望</label>
                <select className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600" value={form.desiredIndustry3 ?? ""} onChange={(e) => update("desiredIndustry3", e.target.value)}>
                  <option value="">選択してください</option>
                  {COMPANY_INDUSTRIES.map((opt) => (
                    <option key={`3-${opt}`} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
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

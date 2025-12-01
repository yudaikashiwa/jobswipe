"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Video = {
  id: string;
  videoUrl: string;
  title: string;
  description: string | null;
  uploadedAt: string;
  student: { id: string; fullName: string | null; university: string | null; avatarUrl?: string | null };
};

export default function SwipeViewer() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [qInput, setQInput] = useState("");
  const [universityInput, setUniversityInput] = useState("");
  const [gradInput, setGradInput] = useState("");
  const [gradeInput, setGradeInput] = useState("");
  const [genderInput, setGenderInput] = useState("");
  // 適用中の条件
  const [q, setQ] = useState("");
  const [university, setUniversity] = useState("");
  const [grad, setGrad] = useState("");
  const [grade, setGrade] = useState("");
  const [gender, setGender] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [indicator, setIndicator] = useState<{ id: string; type: "play" | "pause" } | null>(null);
  const [offeredSet, setOfferedSet] = useState<Set<string>>(new Set());

  const fetchFeed = async (opts?: { append?: boolean }) => {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (university) params.set("university", university);
      if (grad) params.set("grad", grad);
      if (grade) params.set("grade", grade);
      if (gender) params.set("gender", gender);
      const qs = params.toString();
      const url = `/api/feed/videos${qs ? `?${qs}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      if (opts?.append) {
        setVideos((prev) => {
          const seen = new Set(prev.map((v) => v.id));
          const merged = [...prev];
          for (const v of data.videos || []) if (!seen.has(v.id)) merged.push(v);
          return merged;
        });
      } else {
        setVideos(data.videos || []);
      }
      if (Array.isArray(data.offeredStudentIds)) {
        setOfferedSet(new Set(data.offeredStudentIds));
      }
    } catch (e) {
      setError("フィードの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchFeed();
  }, []);

  // IntersectionObserverで現在表示中の動画を検出して自動再生
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.id!;
          const vid = videoRefs.current.get(id);
          if (!vid) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setActiveId(id);
            vid.muted = muted;
            // @ts-ignore
            vid.playsInline = true;
            vid.play().catch(() => {});
          } else {
            vid.pause();
          }
        });
      },
      { root, threshold: [0, 0.6, 1] }
    );
    const cards = Array.from(root.querySelectorAll("[data-card='video']"));
    cards.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [videos.length, muted]);

  useEffect(() => {
    if (!activeId) return;
    const el = videoRefs.current.get(activeId);
    if (el) el.muted = muted;
  }, [muted, activeId]);

  // アクティブが末尾付近になったら追加ロード
  useEffect(() => {
    if (!activeId) return;
    const index = videos.findIndex((v) => v.id === activeId);
    if (index >= 0 && videos.length - index < 5) fetchFeed({ append: true });
  }, [activeId, videos]);

  const like = async (v: Video) => {
    setLikingId(v.id);
    try {
      // スペック: スワイプの❤でオファーを送信（本文なし）。メッセージは後からチャットで送る
      await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentProfileId: v.student.id }),
      });
    } finally {
      setLikingId(null);
    }
  };

  const skip = async (v: Video) => {
    await fetch("/api/skips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: v.student.id }) });
    // 次のカードへスムーズスクロール
    const root = containerRef.current;
    if (!root) return;
    const el = root.querySelector(`[data-id='${v.id}']`);
    const next = el?.nextElementSibling as HTMLElement | null;
    next?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onKey = (e: KeyboardEvent) => {
    if (!activeId) return;
    if (e.key.toLowerCase() === "l") {
      const v = videos.find((x) => x.id === activeId);
      if (v) like(v);
    } else if (e.key.toLowerCase() === "j" || e.key === "ArrowDown") {
      const root = containerRef.current;
      const el = root?.querySelector(`[data-id='${activeId}']`);
      const next = el?.nextElementSibling as HTMLElement | null;
      next?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (e.key.toLowerCase() === "k" || e.key === "ArrowUp") {
      const root = containerRef.current;
      const el = root?.querySelector(`[data-id='${activeId}']`);
      const prev = el?.previousElementSibling as HTMLElement | null;
      prev?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const content = useMemo(() => {
    if (loading) return <div className="h-full flex items-center justify-center text-neutral-600">読み込み中...</div>;
    if (error) return <div className="h-full flex items-center justify-center text-red-600">{error}</div>;
    if (!videos.length)
      return (
        <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-700">
          <p>表示する動画がありません。</p>
          <button onClick={() => fetchFeed()} className="text-sm inline-flex items-center px-3 py-2 rounded border border-indigo-600 text-indigo-700 hover:bg-indigo-50">再読み込み</button>
        </div>
      );
    return (
      <div ref={containerRef} className="h-[calc(100vh-140px)] max-h-[900px] overflow-y-auto snap-y snap-mandatory rounded-xl border bg-black">
        {videos.map((v) => (
          <section
            key={v.id}
            data-card="video"
            data-id={v.id}
            className="h-[calc(100vh-140px)] max-h-[900px] w-full snap-start"
            onTouchStart={(e) => {
              const t = e.touches[0];
              (e.currentTarget as any)._swipeStart = { x: t.clientX, y: t.clientY, at: Date.now() };
            }}
            onTouchEnd={(e) => {
              const start = (e.currentTarget as any)._swipeStart;
              if (!start) return;
              const t = (e.changedTouches && e.changedTouches[0]) || null;
              if (!t) return;
              const dx = t.clientX - start.x;
              const dy = Math.abs(t.clientY - start.y);
              const dt = Date.now() - start.at;
              const THRESH_X = 80; // 必要な右スワイプ距離
              const THRESH_Y = 60; // 縦方向の許容量
              const THRESH_T = 800; // ミリ秒（素早いスワイプを優先）
              if (dx > THRESH_X && dy < THRESH_Y && dt < 1000) {
                // 右スワイプでプロフィールへ遷移
                router.push(`/students/${v.student.id}`);
              }
            }}
            onMouseDown={(e) => {
              (e.currentTarget as any)._mouseSwipeStart = { x: e.clientX, y: e.clientY, at: Date.now() };
            }}
            onMouseUp={(e) => {
              const start = (e.currentTarget as any)._mouseSwipeStart;
              if (!start) return;
              const dx = e.clientX - start.x;
              const dy = Math.abs(e.clientY - start.y);
              const dt = Date.now() - start.at;
              const THRESH_X = 80;
              const THRESH_Y = 60;
              if (dx > THRESH_X && dy < THRESH_Y && dt < 1000) {
                router.push(`/students/${v.student.id}`);
              }
              (e.currentTarget as any)._mouseSwipeStart = null;
            }}
          >
            <div className="h-full w-full flex">
              {/* 左: 動画領域 */}
              <div className="relative flex-1 flex items-center justify-center bg-black">
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(v.id, el);
                    else videoRefs.current.delete(v.id);
                  }}
                  src={v.videoUrl}
                  className="h-full w-full object-contain"
                  playsInline
                  muted
                  loop
                  controls={false}
                  onClick={(e) => {
                    const el = e.currentTarget as HTMLVideoElement;
                    if (el.paused) {
                      // @ts-ignore
                      el.play?.().catch(() => {});
                      setIndicator({ id: v.id, type: "play" });
                    } else {
                      el.pause();
                      setIndicator({ id: v.id, type: "pause" });
                    }
                    setTimeout(() => {
                      setIndicator((cur) => (cur && cur.id === v.id ? null : cur));
                    }, 600);
                  }}
                />
                {indicator && indicator.id === v.id && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-16 w-16 rounded-full bg-black/50 flex items-center justify-center indicator-pop">
                      {indicator.type === "pause" ? (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <rect x="6" y="4" width="4" height="16" rx="1" fill="#fff" />
                          <rect x="14" y="4" width="4" height="16" rx="1" fill="#fff" />
                        </svg>
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                          <path d="M8 5v14l11-7-11-7z" />
                        </svg>
                      )}
                    </div>
                  </div>
                )}
                {/* オーバーレイ情報（動画の上だが中には配置）*/}
                <div className="absolute bottom-4 left-4 right-4 md:right-24 text-white drop-shadow">
                  <h3 className="text-lg font-semibold">{v.title}</h3>
                  <p className="text-sm opacity-90">{v.student.fullName || "学生"} / {v.student.university || "学校名未設定"}</p>
                </div>
              </div>
              {/* 右: 外側のコントロールカラム */}
              <aside className="w-16 shrink-0 flex flex-col items-center justify-end gap-3 bg-transparent p-2">
                <a href={`/students/${v.student.id}`} className="h-12 w-12 rounded-full overflow-hidden border bg-neutral-200 block">
                  {v.student.avatarUrl ? (
                    <img src={v.student.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : null}
                </a>
                <button onClick={() => setMuted((m) => !m)} className="h-10 w-10 rounded-full bg-white text-neutral-700 border flex items-center justify-center">
                  {muted ? "🔇" : "🔊"}
                </button>
                <button
                  onClick={() => like(v)}
                  disabled={likingId === v.id || offeredSet.has(v.student.id)}
                  aria-label="気になる"
                  title="気になる"
                  className="h-10 w-10 rounded-full bg-white text-indigo-700 border flex items-center justify-center disabled:opacity-60 hover:bg-indigo-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 21s-6.5-4.12-9-7.18C1 11 1.5 7.5 4.5 6.2 7 5.1 9 6.5 12 9c3-2.5 5-3.9 7.5-2.8 3 1.3 3.5 4.8 1.5 7.62C18.5 16.88 12 21 12 21z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button onClick={() => skip(v)} className="h-10 w-10 rounded-full bg-white text-neutral-700 border flex items-center justify-center">↷</button>
              </aside>
            </div>
          </section>
        ))}
      </div>
    );
  }, [loading, error, videos, likingId]);

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <form
        className="card p-3 mb-3 grid grid-cols-1 md:grid-cols-5 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(qInput.trim());
          setUniversity(universityInput.trim());
          setGrad(gradInput.trim());
          setGrade(gradeInput.trim());
          setGender(genderInput.trim());
          setLoading(true);
          fetchFeed({ append: false });
        }}
      >
        <input
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="キーワード（タイトル・説明・プロフィール）"
          className="field"
        />
        <input
          value={universityInput}
          onChange={(e) => setUniversityInput(e.target.value)}
          placeholder="大学名"
          className="field"
        />
        <select
          value={gradInput}
          onChange={(e) => setGradInput(e.target.value)}
          className="field"
        >
          <option value="">卒業年を選択</option>
          {GRAD_YEARS.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        <select
          value={gradeInput}
          onChange={(e) => setGradeInput(e.target.value)}
          className="field"
        >
          <option value="">学年を選択</option>
          {GRADE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <select
          value={genderInput}
          onChange={(e) => setGenderInput(e.target.value)}
          className="field"
        >
          <option value="">性別を選択</option>
          <option value="男性">男性</option>
          <option value="女性">女性</option>
          <option value="その他">その他</option>
        </select>
        <div className="md:col-span-5 flex justify-end gap-2">
          <button type="button" className="btn btn-outline" onClick={() => {
            setQInput(""); setUniversityInput(""); setGradInput(""); setGradeInput(""); setGenderInput("");
            setQ(""); setUniversity(""); setGrad(""); setGrade(""); setGender("");
            setLoading(true);
            fetchFeed({ append: false });
          }}>クリア</button>
          <button type="submit" className="btn btn-primary">検索</button>
        </div>
      </form>
      {content}
    </div>
  );
}

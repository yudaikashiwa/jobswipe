"use client";
import { signOut } from "next-auth/react";

type Variant = "icon" | "outline" | "primary";

export function SignOutButton({ className, variant = "icon" }: { className?: string; variant?: Variant }) {
  const base =
    variant === "icon"
      ? "inline-flex items-center justify-center h-10 w-10 rounded-md border border-transparent text-neutral-700 hover:bg-neutral-100"
      : variant === "primary"
      ? "btn btn-primary"
      : "btn btn-outline";
  const cls = className ? `${base} ${className}` : base;
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={cls}
      aria-label="サインアウト"
      title="サインアウト"
    >
      {/* logout icon */}
      {variant === "icon" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none">
          <path d="M14 4H6a2 2 0 00-2 2v12a2 2 0 002 2h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 12h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18 9l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <span className="sr-only">サインアウト</span>
        </svg>
      ) : (
        <span>サインアウト</span>
      )}
    </button>
  );
}

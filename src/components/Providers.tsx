"use client";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import Header from "@/components/layout/Header";
import CompanySidebar from "@/components/layout/CompanySidebar";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { useSession } from "next-auth/react";

function LayoutShell({ children }: { children: ReactNode }) {
  const { data } = useSession();
  const userType = data?.user?.userType;
  if (userType === "COMPANY") {
    return (
      <div className="min-h-screen flex">
        <CompanySidebar />
        <div className="flex-1 min-w-0">
          <Header />
          {children}
        </div>
      </div>
    );
  }
  if (userType === "STUDENT") {
    return (
      <div className="min-h-screen flex">
        <StudentSidebar />
        <div className="flex-1 min-w-0">
          <Header />
          {children}
        </div>
      </div>
    );
  }
  return (
    <>
      <Header />
      {children}
    </>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LayoutShell>{children}</LayoutShell>
    </SessionProvider>
  );
}

import "./globals.css";
import type { ReactNode } from "react";
import Providers from "@/components/Providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

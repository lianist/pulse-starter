import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PULSE",
  description: "PULSE 실습 프로젝트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

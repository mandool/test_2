import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "매출기록 자동화 플랫폼 | Smart Sales Intelligence",
  description: "시간, 소속, 채널 3축 다차원 분석 및 엑셀 일괄입력, POS 연동, 마케팅/VMD 이벤트 전후 성과 분석 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <head>
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}

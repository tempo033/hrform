import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Shell from "@/components/shell";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "نظام الموارد البشرية | شركة البنية الأساسية للمقاولات",
  description:
    "منظومة متكاملة لإدارة شؤون الموظفين وفق نظام العمل السعودي: الموظفون، الإقامات، الكفالة، النماذج الرسمية، انتهاء العلاقة التعاقدية وحساب مكافأة نهاية الخدمة.",
  applicationName: "نظام الموارد البشرية",
  appleWebApp: {
    capable: true,
    title: "الموارد البشرية",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1613",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${plex.variable} bg-[#ecefed] font-sans text-stone-800 antialiased`}>
        <div className="app-root">
          <Shell>{children}</Shell>
        </div>
        <div id="print-portal" className="print-portal" />
      </body>
    </html>
  );
}

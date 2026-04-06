import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar"; // ייבוא הניווט

export const metadata: Metadata = {
  title: "Wedding Planner AI",
  description: "ניהול חתונה חכם",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <Navbar /> {/* התפריט יהיה פה תמיד */}
        {children}
      </body>
    </html>
  );
}

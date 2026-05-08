import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar"; // ייבוא הניווט

export const metadata: Metadata = {
  title: "Digital Wedding Planner",
  description: "המערכת החכמה לניהול חתונות, סידורי הושבה ואישורי הגעה.",
  openGraph: {
    title: "Digital Wedding Planner",
    description: "ניהול האירוע שלכם מעולם לא היה פשוט יותר.",
    url: "https://wedding-project-omega-flame.vercel.app", // הכתובת הכללית של המערכת
    siteName: "Digital Wedding Planner",
    images: [
      {
        url: "/logo.png", // הלוגו הגנרי שיצרנו
        width: 800,
        height: 600,
      },
    ],
    locale: "he_IL",
    type: "website",
  },
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

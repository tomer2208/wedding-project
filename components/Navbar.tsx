"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // הסטייט שישמור את שם הזוג
  const [coupleNames, setCoupleNames] = useState("הזוג המאושר");

  // משיכת שם הזוג כשהתפריט נטען
  useEffect(() => {
    const fetchNames = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("couple_names")
          .eq("id", session.user.id)
          .single();

        if (data && data.couple_names) {
          setCoupleNames(data.couple_names);
        }
      }
    };
    fetchNames();
  }, [supabase]);

  // הפונקציה שמנתקת את המשתמש
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/login");
  };

  const menuItems = [
    { name: "עמוד הבית", href: "/" },
    { name: "ניהול מוזמנים", href: "/guests" },
    { name: "סידור הושבה חכם", href: "/seating" },
    { name: "ניהול תקציב", href: "/Budget" },
    { name: "מחשבון אלכוהול", href: "/Alcohol" },
    { name: "תמונת מצב", href: "/dashboard" },
  ];

  // ✅ התיקון הקריטי: שימוש ב-includes כדי לתפוס נתיבים דינמיים כמו /[slug]/rsvp/[id]
  if (
    pathname.includes("/rsvp") ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return null;
  }

  return (
    <>
      {/* כפתור התנתקות גלובלי - צף מצד שמאל */}
      <div className="fixed top-5 left-5 z-[100]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-md text-stone-600 font-bold text-sm rounded-full border border-stone-200 shadow-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95"
          aria-label="התנתק"
        >
          <span>🚪</span>
          <span className="hidden md:inline">התנתק</span>
        </button>
      </div>

      {/* כפתור ההמבורגר - צף מצד ימין */}
      <nav className="fixed top-5 right-5 z-[100]" dir="rtl">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 flex flex-col items-center justify-center gap-1.5 bg-wedding-dark text-wedding-beige rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-wedding-sand/20 backdrop-blur-sm"
          aria-label="תפריט"
        >
          <span
            className={`h-0.5 w-6 bg-current transition-all duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`}
          ></span>
          <span
            className={`h-0.5 w-6 bg-current transition-all duration-300 ${isOpen ? "opacity-0" : ""}`}
          ></span>
          <span
            className={`h-0.5 w-6 bg-current transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`}
          ></span>
        </button>
      </nav>

      {/* שכבת טשטוש רקע (Overlay) */}
      <div
        className={`fixed inset-0 bg-wedding-dark/40 backdrop-blur-md z-[90] transition-opacity duration-500 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* התפריט הצידי */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-wedding-beige shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[95] transform transition-transform duration-500 ease-out border-l border-wedding-sand ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        dir="rtl"
      >
        <div className="p-12 flex flex-col h-full">
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-wedding-dark border-b border-wedding-sand pb-4">
              Wedding Planner
            </h2>
          </div>

          <nav className="flex flex-col gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="text-2xl font-medium text-wedding-brown hover:text-wedding-dark hover:translate-x-3 transition-all duration-300 flex items-center gap-3"
              >
                <span className="w-1.5 h-1.5 bg-wedding-sand rounded-full opacity-0 hover:opacity-100 transition-opacity"></span>
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-10 flex flex-col gap-4 border-t border-wedding-sand/50">
            <div className="text-stone-400 text-sm italic">
              מתרגשים איתכם, <br />
              <span className="text-wedding-brown font-bold not-italic">
                {coupleNames}
              </span>
            </div>

            {/* כפתור התנתקות גם בתוך התפריט למקרה שנוח להם משם */}
            <button
              onClick={handleLogout}
              className="text-right text-stone-500 font-bold hover:text-red-500 transition-colors text-sm mt-4"
            >
              התנתק מהמערכת 🚪
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

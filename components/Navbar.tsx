"use client";

import { useState } from "react";
import Link from "next/link";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // סדר התפריט עודכן: דאשבורד נמצא עכשיו בסוף הרשימה
  const menuItems = [
    { name: "דף הבית", href: "/" },
    { name: "ניהול מוזמנים", href: "/guests" },
    { name: "ניהול תקציב", href: "/Budget" },
    { name: "מחשבון אלכוהול", href: "/Alcohol" },
    { name: "תמונת מצב", href: "/dashboard" },
  ];

  return (
    <>
      {/* כפתור ההמבורגר - עם z-index גבוה מאוד (100) */}
      <nav className="fixed top-5 right-5 z-[100]" dir="rtl">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 flex flex-col items-center justify-center gap-1.5 bg-wedding-dark text-wedding-beige rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-wedding-sand/20 backdrop-blur-sm"
          aria-label="תפריט"
        >
          {/* האנימציה של הפסים */}
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

      {/* שכבת טשטוש רקע (Overlay) - z-index: 90 */}
      <div
        className={`fixed inset-0 bg-wedding-dark/40 backdrop-blur-md z-[90] transition-opacity duration-500 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* התפריט הצידי - z-index: 95 */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-wedding-beige shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[95] transform transition-transform duration-500 ease-out border-l border-wedding-sand ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
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

          <div className="mt-auto pt-10 text-stone-400 text-sm italic border-t border-wedding-sand/50">
            מתרגשים איתכם, <br />
            <span className="text-wedding-brown font-bold not-italic">
              סיוון ותומר
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      // 1. האם מחובר?
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // 2. האם יש פרופיל?
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error && error.code === "PGRST116") {
        router.push("/settings");
        return;
      }

      // 3. הכל תקין - נשמור את הפרופיל ונציג את העמוד
      if (profileData) {
        setProfile(profileData);
      }
      setIsChecking(false);
    };

    checkAuthAndFetchProfile();
  }, [router, supabase]);

  // מסך טעינה לבן בזמן שהמערכת בודקת הרשאות
  if (isChecking) {
    return (
      <div className="min-h-screen bg-wedding-beige flex items-center justify-center">
        <div className="animate-pulse text-wedding-brown font-serif italic text-2xl">
          טוען את מרכז הבקרה...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans" dir="rtl">
      {/* אזור הברכה */}
      <section className="bg-wedding-dark text-wedding-beige pt-28 pb-16 px-6 text-center rounded-b-[48px] shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            ברוכים הבאים, {profile ? profile.couple_names : "הזוג המאושר"}! 🤍
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-xl mx-auto font-light">
            זהו מרכז הבקרה שלכם. כאן תנהלו את כל מה שקשור לחתונה שלכם בצורה
            חכמה, מסודרת ופשוטה.
          </p>
        </div>
        {/* קישוט */}
        <div className="absolute top-10 right-10 text-9xl opacity-5 pointer-events-none rotate-12">
          ✨
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-12 -mt-8 relative z-20 space-y-12">
        {/* מדריך מהיר - איך מתחילים */}
        <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-xl border border-stone-100">
          <h2 className="text-2xl font-bold text-wedding-dark mb-8 text-center border-b border-stone-100 pb-4">
            איך מתחילים לעבוד עם המערכת? 🤔
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* קו מחבר בין השלבים (מוסתר במובייל) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-stone-100 z-0"></div>

            {/* שלב 1 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-wedding-beige text-wedding-brown rounded-full flex items-center justify-center text-2xl font-black mb-4 border-4 border-white shadow-md group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">
                ניהול מוזמנים
              </h3>
              <p className="text-sm text-stone-500 mb-4 px-2">
                הוסיפו אורחים ידנית או העלו קובץ אקסל. תוכלו לשלוח להם הודעות
                וואטסאפ אישיות לאישור הגעה.
              </p>
              <Link
                href="/guests"
                className="text-wedding-brown font-bold text-sm hover:underline"
              >
                לרשימת המוזמנים ←
              </Link>
            </div>

            {/* שלב 2 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-wedding-beige text-wedding-brown rounded-full flex items-center justify-center text-2xl font-black mb-4 border-4 border-white shadow-md group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">
                ניהול תקציב
              </h3>
              <p className="text-sm text-stone-500 mb-4 px-2">
                הזינו את הספקים שלכם, כמה תכננתם לשלם, כמה שילמתם בפועל ומעקב
                אחרי מקדמות.
              </p>
              <Link
                href="/Budget"
                className="text-wedding-brown font-bold text-sm hover:underline"
              >
                לניהול התקציב ←
              </Link>
            </div>

            {/* שלב 3 */}
            <div className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-16 h-16 bg-wedding-beige text-wedding-brown rounded-full flex items-center justify-center text-2xl font-black mb-4 border-4 border-white shadow-md group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">
                תמונת מצב חיה
              </h3>
              <p className="text-sm text-stone-500 mb-4 px-2">
                כנסו לדאשבורד כדי לראות את הכל מתחבר: כמה אישרו הגעה, גרפים של
                הוצאות וטיימר לחתונה.
              </p>
              <Link
                href="/dashboard"
                className="text-wedding-brown font-bold text-sm hover:underline"
              >
                לדאשבורד המסכם ←
              </Link>
            </div>
          </div>
        </div>

        {/* גישה מהירה */}
        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-6 px-2">
            גישה מהירה לכלים
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/dashboard"
              className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-wedding-brown hover:shadow-md transition-all text-center group flex flex-col items-center"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform block">
                📊
              </span>
              <span className="font-bold text-stone-700">תמונת מצב</span>
            </Link>

            <Link
              href="/guests"
              className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-wedding-brown hover:shadow-md transition-all text-center group flex flex-col items-center"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform block">
                👥
              </span>
              <span className="font-bold text-stone-700">מוזמנים</span>
            </Link>

            <Link
              href="/Budget"
              className="bg-white p-6 rounded-2xl border border-stone-200 hover:border-wedding-brown hover:shadow-md transition-all text-center group flex flex-col items-center"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform block">
                💰
              </span>
              <span className="font-bold text-stone-700">תקציב</span>
            </Link>

            <Link
              href="/settings"
              className="bg-stone-100 p-6 rounded-2xl border border-stone-200 hover:border-stone-400 hover:shadow-md transition-all text-center group flex flex-col items-center"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform block">
                ⚙️
              </span>
              <span className="font-bold text-stone-600">הגדרות אירוע</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

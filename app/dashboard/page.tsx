"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Guest } from "@/types/guest";

interface BudgetItem {
  id: string;
  planned: number;
  actual: number;
  downpayment: number;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [budget, setBudget] = useState<BudgetItem[]>([]);

  // שעון עצר
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);

    // טעינת נתונים
    const savedGuests = localStorage.getItem("wedding_guests");
    if (savedGuests) {
      try {
        setGuests(JSON.parse(savedGuests));
      } catch (e) {}
    }

    const savedBudget = localStorage.getItem("wedding_budget");
    if (savedBudget) {
      try {
        setBudget(JSON.parse(savedBudget));
      } catch (e) {}
    }

    // הגדרת תאריך החתונה (2 ביוני 2026)
    const weddingDate = new Date("2026-06-02T19:30:00").getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = weddingDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // חישוב כל הסטטיסטיקות (אישורי הגעה + תקציב)
  const stats = useMemo(() => {
    const totalGuests = guests.reduce((acc, g) => acc + g.expectedGuests, 0);
    const confirmed = guests
      .filter((g) => g.status === "Confirmed")
      .reduce((acc, g) => acc + g.expectedGuests, 0);
    const pending = guests
      .filter((g) => g.status === "Pending")
      .reduce((acc, g) => acc + g.expectedGuests, 0);
    const declined = guests
      .filter((g) => g.status === "Declined")
      .reduce((acc, g) => acc + g.expectedGuests, 0);

    const totalExpenses = budget.reduce(
      (acc, item) => acc + (item.actual > 0 ? item.actual : item.planned),
      0,
    );
    const totalPaid = budget.reduce(
      (acc, item) => acc + (item.downpayment || 0),
      0,
    );
    const remainingToPay = totalExpenses - totalPaid;

    // חישוב מנה לפי כמות המאשרים (או סה"כ אם עדיין אין אישורים)
    const divisor =
      confirmed > 0 ? confirmed : totalGuests > 0 ? totalGuests : 1;
    const costPerGuest = Math.round(totalExpenses / divisor);

    const groomGuests = guests
      .filter((g) => g.side === "Groom")
      .reduce((acc, g) => acc + g.expectedGuests, 0);
    const brideGuests = guests
      .filter((g) => g.side === "Bride")
      .reduce((acc, g) => acc + g.expectedGuests, 0);

    return {
      totalGuests,
      confirmed,
      pending,
      declined,
      totalExpenses,
      totalPaid,
      remainingToPay,
      costPerGuest,
      groomGuests,
      brideGuests,
    };
  }, [guests, budget]);

  if (!mounted) return null;

  // אחוזים לאישורי הגעה
  const confirmedPercent =
    stats.totalGuests === 0
      ? 0
      : Math.round((stats.confirmed / stats.totalGuests) * 100);
  const pendingPercent =
    stats.totalGuests === 0
      ? 0
      : Math.round((stats.pending / stats.totalGuests) * 100);
  const declinedPercent =
    stats.totalGuests === 0
      ? 0
      : Math.round((stats.declined / stats.totalGuests) * 100);

  return (
    <div
      className="min-h-screen bg-wedding-beige p-8 pt-24 text-wedding-brown"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* שעון עצר לחתונה */}
        <div className="bg-white rounded-[32px] p-8 border border-wedding-sand shadow-sm text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-wedding-dark mb-2">
            החתונה של סיוון ותומר
          </h1>
          <p className="text-stone-500 mb-8">
            2 ביוני 2026 • מתרגשים יחד איתכם!
          </p>

          <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
            {[
              { label: "ימים", value: timeLeft.days },
              { label: "שעות", value: timeLeft.hours },
              { label: "דקות", value: timeLeft.minutes },
              { label: "שניות", value: timeLeft.seconds },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-stone-50 border-2 border-wedding-sand rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-black text-wedding-brown mb-2 shadow-inner">
                  {item.value}
                </div>
                <span className="text-xs font-bold text-stone-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4 קוביות מדדים ראשיים */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-wedding-sand shadow-sm text-center">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-xs font-bold text-stone-400 mb-1">
              סה"כ מוזמנים
            </p>
            <p className="text-4xl font-black text-wedding-dark">
              {stats.totalGuests}
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-3xl border border-green-200 shadow-sm text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-xs font-bold text-green-700 mb-1">אישרו הגעה</p>
            <p className="text-4xl font-black text-green-600">
              {stats.confirmed}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-wedding-sand shadow-sm text-center">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-xs font-bold text-stone-400 mb-1">סה"כ הוצאות</p>
            <p className="text-4xl font-black text-wedding-dark">
              ₪{stats.totalExpenses.toLocaleString()}
            </p>
          </div>

          <div className="bg-wedding-dark p-6 rounded-3xl border border-wedding-dark shadow-xl text-center transform hover:-translate-y-1 transition-all">
            <div className="text-3xl mb-2">🍽️</div>
            <p className="text-xs font-bold text-wedding-beige/70 mb-1">
              עלות למנה
            </p>
            <p className="text-4xl font-black text-wedding-sand">
              ₪{stats.costPerGuest.toLocaleString()}
            </p>
          </div>
        </div>

        {/* גרפים ופירוט - 2 עמודות */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* עמודה 1: אישורי הגעה */}
          <div className="bg-white p-8 rounded-[32px] border border-wedding-sand shadow-sm">
            <h3 className="font-bold text-wedding-dark mb-6 text-lg border-b border-wedding-sand/30 pb-2">
              סטטוס אישורי הגעה
            </h3>

            <div className="space-y-6">
              <div className="h-6 w-full flex rounded-full overflow-hidden bg-stone-100">
                <div
                  style={{ width: `${confirmedPercent}%` }}
                  className="bg-green-500 transition-all duration-1000"
                ></div>
                <div
                  style={{ width: `${pendingPercent}%` }}
                  className="bg-yellow-400 transition-all duration-1000"
                ></div>
                <div
                  style={{ width: `${declinedPercent}%` }}
                  className="bg-red-400 transition-all duration-1000"
                ></div>
              </div>

              <div className="flex justify-between text-sm font-bold">
                <div className="flex items-center gap-2 text-green-700">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>{" "}
                  אישרו ({stats.confirmed})
                </div>
                <div className="flex items-center gap-2 text-yellow-700">
                  <span className="w-3 h-3 rounded-full bg-yellow-400"></span>{" "}
                  ממתינים ({stats.pending})
                </div>
                <div className="flex items-center gap-2 text-red-700">
                  <span className="w-3 h-3 rounded-full bg-red-400"></span>{" "}
                  סירבו ({stats.declined})
                </div>
              </div>
            </div>
          </div>

          {/* עמודה 2: מצב תשלומים */}
          <div className="bg-white p-8 rounded-[32px] border border-wedding-sand shadow-sm">
            <h3 className="font-bold text-wedding-dark mb-6 text-lg border-b border-wedding-sand/30 pb-2">
              מצב תשלומים לספקים
            </h3>
            <div className="flex justify-between items-center mb-3">
              <span className="text-stone-500 font-bold text-sm">
                שולם (מקדמות):
              </span>
              <span className="text-xl font-black text-green-600">
                ₪{stats.totalPaid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-bold text-sm">
                נותר לשלם:
              </span>
              <span className="text-xl font-black text-red-500">
                ₪{stats.remainingToPay.toLocaleString()}
              </span>
            </div>

            <div className="w-full bg-stone-100 rounded-full h-3 mt-6 overflow-hidden">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                style={{
                  width: `${stats.totalExpenses > 0 ? (stats.totalPaid / stats.totalExpenses) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* ניווט מהיר */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Link
            href="/guests"
            className="bg-stone-50 p-6 rounded-2xl border border-stone-200 hover:border-wedding-brown transition-all text-center group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              📋
            </div>
            <h3 className="font-bold text-wedding-dark">ניהול מוזמנים</h3>
          </Link>
          <Link
            href="/seating"
            className="bg-stone-50 p-6 rounded-2xl border border-stone-200 hover:border-wedding-brown transition-all text-center group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              🎯
            </div>
            <h3 className="font-bold text-wedding-dark">סידור הושבה חכם</h3>
          </Link>
          <Link
            href="/Budget"
            className="bg-stone-50 p-6 rounded-2xl border border-stone-200 hover:border-wedding-brown transition-all text-center group"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
              💵
            </div>
            <h3 className="font-bold text-wedding-dark">ניהול תקציב</h3>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Guest } from "@/types/guest";

// הגדרת המבנה של שורת הוצאה (כדי ש-TypeScript יכיר)
interface BudgetItem {
  id: string;
  planned: number;
  actual: number;
  downpayment: number;
}

export default function SummaryPage() {
  const [mounted, setMounted] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [budget, setBudget] = useState<BudgetItem[]>([]);

  // שאיבת כל הנתונים מכל העמודים במערכת
  useEffect(() => {
    setMounted(true);

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
  }, []);

  // חישוב כל הסטטיסטיקות של החתונה
  const stats = useMemo(() => {
    // 1. כמות מוזמנים
    const totalGuests = guests.reduce((acc, g) => acc + g.expectedGuests, 0);

    // 2. הוצאות: מחשב את המחיר בפועל. אם אין מחיר בפועל (0), לוקח את המתוכנן כהערכה.
    const totalExpenses = budget.reduce((acc, item) => {
      const cost = item.actual > 0 ? item.actual : item.planned;
      return acc + cost;
    }, 0);

    // 3. מקדמות ויתרות
    const totalPaid = budget.reduce(
      (acc, item) => acc + (item.downpayment || 0),
      0,
    );
    const remainingToPay = totalExpenses - totalPaid;

    // 4. עלות למנה בודדת (סה"כ הוצאות חלקי כמות אורחים)
    const costPerGuest =
      totalGuests > 0 ? Math.round(totalExpenses / totalGuests) : 0;

    // 5. פילוח מוזמנים לפי צדדים
    const groomGuests = guests
      .filter((g) => g.side === "Groom")
      .reduce((acc, g) => acc + g.expectedGuests, 0);
    const brideGuests = guests
      .filter((g) => g.side === "Bride")
      .reduce((acc, g) => acc + g.expectedGuests, 0);
    const jointGuests = guests
      .filter((g) => g.side === "Joint")
      .reduce((acc, g) => acc + g.expectedGuests, 0);

    return {
      totalGuests,
      totalExpenses,
      totalPaid,
      remainingToPay,
      costPerGuest,
      groomGuests,
      brideGuests,
      jointGuests,
    };
  }, [guests, budget]);

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen bg-wedding-beige p-8 text-wedding-brown"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto pt-32">
        {/* כותרת הדאשבורד */}
        <div className="mb-12 border-b border-wedding-sand pb-6 text-center md:text-right">
          <h1 className="text-4xl font-serif font-bold text-wedding-dark">
            סיכום חתונה (Dashboard)
          </h1>
          <p className="text-stone-500 mt-2 italic text-lg opacity-80">
            תמונת מצב עדכנית של כל הנתונים שלכם
          </p>
        </div>

        {/* שלוש הקוביות הראשיות */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* קוביית מוזמנים */}
          <div className="bg-white p-8 rounded-[32px] border border-wedding-sand shadow-sm text-center relative overflow-hidden group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              👥
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-2">
              סה"כ מוזמנים
            </p>
            <p className="text-5xl font-black text-wedding-dark">
              {stats.totalGuests}
            </p>
          </div>

          {/* קוביית הוצאות */}
          <div className="bg-white p-8 rounded-[32px] border border-wedding-sand shadow-sm text-center relative overflow-hidden group">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              💰
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-2">
              סה"כ הוצאות חתונה
            </p>
            <p className="text-5xl font-black text-wedding-dark">
              ₪{stats.totalExpenses.toLocaleString()}
            </p>
            <p className="text-[10px] text-stone-400 mt-2">
              (משוער לפי חוזים ומתוכנן)
            </p>
          </div>

          {/* קוביית מחיר למנה (הדייט החשוב ביותר) */}
          <div className="bg-wedding-dark p-8 rounded-[32px] border-2 border-wedding-sand/20 shadow-xl text-center relative overflow-hidden group transform hover:-translate-y-1 transition-all">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              🍽️
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-wedding-beige/70 mb-2">
              עלות מחושבת למנה
            </p>
            <p className="text-5xl font-black text-wedding-sand">
              ₪{stats.costPerGuest.toLocaleString()}
            </p>
            <div className="absolute top-[-20px] left-[-20px] text-8xl opacity-5">
              📈
            </div>
          </div>
        </div>

        {/* שורת סטטיסטיקות נוספות (כספים וצדדים) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* מצב כספי (מקדמות ויתרות) */}
          <div className="bg-white/50 p-8 rounded-[32px] border border-wedding-sand shadow-sm flex flex-col justify-center">
            <h3 className="font-bold text-wedding-dark mb-6 text-lg border-b border-wedding-sand/30 pb-2">
              מצב תשלומים לספקים
            </h3>
            <div className="flex justify-between items-center mb-4">
              <span className="text-stone-500 font-bold text-sm">
                שולם עד כה (מקדמות):
              </span>
              <span className="text-xl font-black text-green-600">
                ₪{stats.totalPaid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-bold text-sm">
                נותר לשלם (יתרה):
              </span>
              <span className="text-xl font-black text-red-500">
                ₪{stats.remainingToPay.toLocaleString()}
              </span>
            </div>

            {/* פס התקדמות קטן */}
            <div className="w-full bg-wedding-beige/50 rounded-full h-3 mt-6 overflow-hidden">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                style={{
                  width: `${stats.totalExpenses > 0 ? (stats.totalPaid / stats.totalExpenses) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* פילוח מוזמנים */}
          <div className="bg-white/50 p-8 rounded-[32px] border border-wedding-sand shadow-sm flex flex-col justify-center">
            <h3 className="font-bold text-wedding-dark mb-6 text-lg border-b border-wedding-sand/30 pb-2">
              פילוח מוזמנים לפי צד
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-stone-600 font-bold text-sm">
                    צד חתן
                  </span>
                </div>
                <span className="text-lg font-black text-wedding-dark">
                  {stats.groomGuests} אורחים
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                  <span className="text-stone-600 font-bold text-sm">
                    צד כלה
                  </span>
                </div>
                <span className="text-lg font-black text-wedding-dark">
                  {stats.brideGuests} אורחים
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-stone-400"></div>
                  <span className="text-stone-600 font-bold text-sm">
                    משותף
                  </span>
                </div>
                <span className="text-lg font-black text-wedding-dark">
                  {stats.jointGuests} אורחים
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

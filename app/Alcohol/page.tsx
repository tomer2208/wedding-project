"use client";

import { useState, useEffect, useMemo } from "react";

const QUALITY_PRICES = {
  basic: {
    vodka: 75,
    whiskey: 110,
    tequila: 120,
    aperitif: 70,
    wine: 45,
    beer: 6,
    soft: 6,
  },
  premium: {
    vodka: 110,
    whiskey: 160,
    tequila: 180,
    aperitif: 90,
    wine: 75,
    beer: 10,
    soft: 6,
  },
  luxury: {
    vodka: 140,
    whiskey: 135,
    tequila: 210,
    aperitif: 80,
    wine: 130,
    beer: 14,
    soft: 6,
  },
};

type DrinkKey =
  | "vodka"
  | "tequila"
  | "beer"
  | "whiskey"
  | "aperitif"
  | "wine"
  | "soft";

export default function AlcoholCalculator() {
  const [mounted, setMounted] = useState(false);

  const [profile, setProfile] = useState({
    young: 120,
    adults: 230,
    kids: 0,
    quality: "luxury" as keyof typeof QUALITY_PRICES,
  });

  const [ratios, setRatios] = useState({
    vodka: 10,
    tequila: 17,
    beer: 1.5,
    whiskey: 40,
    aperitif: 100,
  });

  useEffect(() => {
    setMounted(true);
    const savedGuests = localStorage.getItem("wedding_guests");
    if (savedGuests) {
      const guests = JSON.parse(savedGuests);
      const total = guests.reduce(
        (acc: number, g: any) => acc + (Number(g.expectedGuests) || 1),
        0,
      );
      if (total > 0) {
        setProfile((prev) => ({
          ...prev,
          adults: Math.floor(total * 0.65),
          young: Math.floor(total * 0.35),
          kids: 0,
        }));
      }
    }
  }, []);

  const calculation = useMemo(() => {
    const emptyQty = {
      vodka: 0,
      tequila: 0,
      beer: 0,
      whiskey: 0,
      aperitif: 0,
      wine: 0,
      soft: 0,
    };
    if (!mounted) return { qty: emptyQty, cost: emptyQty, totalCost: 0 };

    const { young, adults, kids, quality } = profile;
    const currentPrices = QUALITY_PRICES[quality];
    const totalGuests = young + adults;

    const qty: Record<DrinkKey, number> = {
      vodka: Math.ceil(totalGuests / (ratios.vodka || 1)),
      tequila: Math.ceil(totalGuests / (ratios.tequila || 1)),
      beer: Math.ceil(totalGuests * (ratios.beer || 0)),
      whiskey: Math.ceil(totalGuests / (ratios.whiskey || 1)),
      aperitif: Math.ceil(totalGuests / (ratios.aperitif || 1)),
      wine: Math.ceil(totalGuests * 0.12),
      soft: Math.ceil((totalGuests + kids) * 1.2),
    };

    const cost: Record<DrinkKey, number> = {
      vodka: qty.vodka * currentPrices.vodka,
      tequila: qty.tequila * currentPrices.tequila,
      beer: qty.beer * currentPrices.beer,
      whiskey: qty.whiskey * currentPrices.whiskey,
      aperitif: qty.aperitif * currentPrices.aperitif,
      wine: qty.wine * currentPrices.wine,
      soft: qty.soft * currentPrices.soft,
    };

    const totalCost = Object.values(cost).reduce((a, b) => a + b, 0);
    return { qty, cost, totalCost };
  }, [profile, ratios, mounted]);

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen bg-wedding-beige p-8 text-wedding-brown font-sans"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto pt-16">
        {/* Header */}
        <div className="mb-12 border-b border-wedding-sand pb-6 text-center md:text-right">
          <h1 className="text-4xl font-serif font-bold text-wedding-dark">
            מחשבון אלכוהול ותקציב
          </h1>
          <p className="text-stone-500 mt-2 italic text-lg opacity-80">
            ניהול כמויות חכם בהתאמה אישית
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Sidebar (Inputs) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Guests Card */}
            <div className="bg-white p-7 rounded-3xl border border-wedding-sand shadow-sm">
              <h2 className="text-lg font-bold text-wedding-dark mb-5 flex items-center gap-2">
                <span>👥</span> כמות אורחים
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">
                    צעירים
                  </label>
                  <input
                    type="number"
                    value={profile.young}
                    onChange={(e) =>
                      setProfile({ ...profile, young: +e.target.value })
                    }
                    className="w-full bg-wedding-beige/20 border border-wedding-sand p-2 rounded-xl text-center font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">
                    מבוגרים
                  </label>
                  <input
                    type="number"
                    value={profile.adults}
                    onChange={(e) =>
                      setProfile({ ...profile, adults: +e.target.value })
                    }
                    className="w-full bg-wedding-beige/20 border border-wedding-sand p-2 rounded-xl text-center font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Ratios Card */}
            <div className="bg-white p-7 rounded-3xl border border-wedding-sand shadow-sm border-r-4 border-r-wedding-sand">
              <h2 className="text-lg font-bold text-wedding-dark mb-5 flex items-center gap-2">
                <span>📐</span> הגדרת יחסי שתייה
              </h2>
              <div className="space-y-4">
                {[
                  { label: "וודקה (1 ל-X)", key: "vodka" },
                  { label: "טקילה (1 ל-X)", key: "tequila" },
                  { label: "בירה (X לאדם)", key: "beer", step: "0.1" },
                  { label: "וויסקי (1 ל-X)", key: "whiskey" },
                  { label: "אפריטיף (1 ל-X)", key: "aperitif" },
                ].map((r) => (
                  <div
                    key={r.key}
                    className="flex justify-between items-center bg-wedding-sand/10 p-3 rounded-2xl"
                  >
                    <span className="text-xs font-bold text-wedding-dark">
                      {r.label}
                    </span>
                    <input
                      type="number"
                      step={r.step || "1"}
                      value={ratios[r.key as keyof typeof ratios]}
                      onChange={(e) =>
                        setRatios({ ...ratios, [r.key]: +e.target.value })
                      }
                      className="w-16 bg-white border border-wedding-sand p-1 rounded-lg text-center font-black text-wedding-dark outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Card */}
            <div className="bg-white p-7 rounded-3xl border border-wedding-sand shadow-sm">
              <h2 className="text-lg font-bold text-wedding-dark mb-5 flex items-center gap-2">
                <span>💎</span> רמת האלכוהול
              </h2>
              <div className="flex flex-col gap-3">
                {(
                  Object.keys(QUALITY_PRICES) as Array<
                    keyof typeof QUALITY_PRICES
                  >
                ).map((q) => {
                  const isSelected = profile.quality === q;
                  return (
                    <button
                      key={q}
                      onClick={() => setProfile({ ...profile, quality: q })}
                      className={`px-6 py-4 rounded-full font-bold transition-all border-2 flex justify-between items-center group relative ${
                        isSelected
                          ? "bg-wedding-dark border-wedding-dark shadow-md ring-2 ring-wedding-dark ring-offset-2 scale-[1.02]"
                          : "bg-transparent border-wedding-sand hover:border-wedding-dark"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* העיגול עם ה-וי */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-wedding-sand border-wedding-sand scale-110"
                              : "border-wedding-sand opacity-30"
                          }`}
                        >
                          {isSelected && (
                            <span className="text-wedding-dark text-[10px] font-black">
                              ✓
                            </span>
                          )}
                        </div>
                        {/* המלל בצבע שונה מהרקע */}
                        <span
                          className={`text-sm transition-colors ${isSelected ? "text-wedding-beige" : "text-wedding-dark"}`}
                        >
                          {q === "basic"
                            ? "בסיסית"
                            : q === "premium"
                              ? "פרימיום"
                              : "סופר פרימיום"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-wedding-dark rounded-[40px] p-10 text-wedding-beige shadow-2xl relative overflow-hidden border-2 border-wedding-sand/10">
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                  <h2 className="text-2xl font-serif font-bold text-white text-center md:text-right">
                    סיכום הזמנה סופי <br />
                    <span className="text-wedding-sand italic">
                      לפי המודל האישי שלכם
                    </span>
                  </h2>
                  <div className="bg-white/10 p-6 rounded-3xl border border-white/20 backdrop-blur-md min-w-[240px] text-center shadow-inner">
                    <p className="text-wedding-sand text-[10px] uppercase font-black mb-1 opacity-80 tracking-widest">
                      תקציב משוער
                    </p>
                    <p className="text-5xl font-black text-wedding-sand drop-shadow-xl">
                      <span className="text-2xl ml-1 font-light opacity-70">
                        ₪
                      </span>
                      {calculation.totalCost.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "וודקה", key: "vodka", icon: "🍸" },
                    { label: "טקילה", key: "tequila", icon: "🌵" },
                    { label: "בירות", key: "beer", icon: "🍺" },
                    { label: "וויסקי", key: "whiskey", icon: "🥃" },
                    { label: "אפריטיפים", key: "aperitif", icon: "🍊" },
                    { label: "יין (אדום/לבן)", key: "wine", icon: "🍷" },
                    { label: "שתייה קלה", key: "soft", icon: "🥤" },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="group bg-white/5 border border-white/10 p-6 rounded-[32px] flex justify-between items-center hover:bg-white/10 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl opacity-60 group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <div>
                          <p className="text-wedding-sand/50 text-[10px] font-black uppercase tracking-wider">
                            {item.label}
                          </p>
                          <p className="text-3xl font-bold text-white">
                            {calculation.qty[
                              item.key as DrinkKey
                            ]?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] opacity-30 italic font-medium">
                          עלות
                        </p>
                        <p className="font-mono font-black text-xl text-wedding-sand">
                          ₪
                          {calculation.cost[
                            item.key as DrinkKey
                          ]?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => window.print()}
                  className="mt-12 w-full bg-wedding-beige border-2 border-wedding-beige text-wedding-dark py-4 rounded-full font-black text-lg hover:bg-wedding-dark hover:text-wedding-beige transition-all shadow-2xl transform active:scale-95"
                >
                  הדפסת רשימה למחסן
                </button>
              </div>

              <div className="absolute top-[-50px] left-[-50px] text-[250px] opacity-[0.02] rotate-12 select-none pointer-events-none text-white">
                🥂
              </div>
            </div>

            <div className="bg-white/50 p-6 rounded-3xl border border-wedding-sand italic text-stone-500 text-sm text-center">
              "שינוי היחסים מאפשר לכם להתאים את המחשבון לקהל ששותה יותר או פחות
              מהממוצע."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

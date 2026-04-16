"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Guest } from "@/types/guest";
import { optimizeSeating, Table } from "@/utils/seatingAlgorithm";
import * as XLSX from "xlsx";
import { createClient } from "@/utils/supabase/client";

export default function SeatingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [results, setResults] = useState<Table[] | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [tableConfig, setTableConfig] = useState({
    count10: 5,
    count12: 5,
    count20: 2,
  });

  // 1. משיכת הנתונים מהענן כשהעמוד עולה
  useEffect(() => {
    const fetchGuestsAndCheckAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error && error.code === "PGRST116") {
        router.push("/settings");
        return;
      }

      // משיכת רשימת האורחים של הזוג מהענן
      const { data: guestsData } = await supabase
        .from("guests")
        .select("*")
        .eq("user_id", session.user.id);

      if (guestsData) {
        setGuests(guestsData as Guest[]);
      }

      setMounted(true);
    };

    fetchGuestsAndCheckAuth();
  }, [router, supabase]);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setResults(null);

    // מסננים החוצה את מי שסירב כדי שהאלגוריתם לא ישבץ אותם בכלל!
    const guestsToSeat = guests.filter((g) => g.status !== "Declined");

    setTimeout(() => {
      const finalTables = optimizeSeating(guestsToSeat, tableConfig);
      setResults(finalTables);
      setIsOptimizing(false);
    }, 500);
  };

  // ==========================================
  // ייצוא אקסל משודרג - "טבלאות קטנות" לכל שולחן
  // ==========================================
  const handleExportSeatingToExcel = () => {
    if (!results || results.length === 0) {
      alert("אין סידור שולחנות לייצוא. אנא הפעל קודם את אלגוריתם ההושבה.");
      return;
    }

    const exportData: any[][] = [];

    results.forEach((table, tableIndex) => {
      const isKnights = table.capacity === 20;

      const tableTitle = isKnights
        ? `👑 שולחן ${tableIndex + 1} - אבירים (${table.currentSeats}/${table.capacity} מושבים)`
        : `🍽️ שולחן ${tableIndex + 1} (${table.currentSeats}/${table.capacity} מושבים)`;

      exportData.push([tableTitle]);
      exportData.push(["שם האורח/משפחה", "כמות אנשים", "הערות"]);

      table.guests.forEach((guest) => {
        exportData.push([
          guest.name,
          guest.expectedGuests,
          guest.ageGroup === "YoungAdults" ? "צעירים" : "",
        ]);
      });

      exportData.push([]);
      exportData.push([]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(exportData);

    worksheet["!cols"] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "סידור הושבה למנהל אירוע",
    );

    XLSX.writeFile(workbook, "סידור_הושבה_לפי_שולחנות.xlsx");
  };

  if (!mounted) return null;

  // חישוב רק של האנשים שבאמת רלוונטיים להושבה (לא כולל מי שסירב)
  const totalGuestsToSeat = guests
    .filter((g) => g.status !== "Declined")
    .reduce((acc, g) => acc + g.expectedGuests, 0);

  return (
    <div
      className="min-h-screen bg-wedding-beige p-8 pt-32 text-wedding-brown"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-serif font-bold text-wedding-dark mb-4">
            סידור הושבה חכם (AI)
          </h1>
          <p className="text-stone-500">
            הגדירו את כמות השולחנות באולם, והאלגוריתם ישבץ את{" "}
            <span className="font-bold text-wedding-dark">
              {totalGuestsToSeat}
            </span>{" "}
            האורחים (מאשרים וממתינים) בצורה אופטימלית.
          </p>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-wedding-sand shadow-sm mb-10">
          <h2 className="font-bold text-wedding-dark text-xl mb-6 border-b border-wedding-sand/30 pb-2">
            הגדרות אולם
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                שולחנות עגולים (10 מושבים)
              </label>
              <input
                type="number"
                min="0"
                value={tableConfig.count10}
                onChange={(e) =>
                  setTableConfig({
                    ...tableConfig,
                    count10: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-wedding-beige/50 border border-wedding-sand rounded-xl p-4 text-wedding-dark font-bold text-lg focus:outline-none focus:border-wedding-brown transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                שולחנות עגולים (12 מושבים)
              </label>
              <input
                type="number"
                min="0"
                value={tableConfig.count12}
                onChange={(e) =>
                  setTableConfig({
                    ...tableConfig,
                    count12: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-wedding-beige/50 border border-wedding-sand rounded-xl p-4 text-wedding-dark font-bold text-lg focus:outline-none focus:border-wedding-brown transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-sm font-bold text-stone-500 uppercase tracking-wider">
                שולחנות אבירים (20 מושבים)
              </label>
              <input
                type="number"
                min="0"
                value={tableConfig.count20}
                onChange={(e) =>
                  setTableConfig({
                    ...tableConfig,
                    count20: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 text-wedding-dark font-bold text-lg focus:outline-none focus:border-blue-400 transition-colors"
              />
              <span className="absolute top-0 left-0 text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-bl-xl rounded-tr-xl font-bold">
                צעירים בלבד
              </span>
            </div>
          </div>

          <button
            onClick={handleOptimize}
            disabled={isOptimizing || totalGuestsToSeat === 0}
            className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all duration-300 ${
              totalGuestsToSeat === 0
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : isOptimizing
                  ? "bg-wedding-sand text-white animate-pulse"
                  : "bg-wedding-dark text-wedding-beige hover:shadow-xl hover:-translate-y-1"
            }`}
          >
            {isOptimizing
              ? "מחשב 20,000 וריאציות הושבה..."
              : "✨ סדר לנו את האולם!"}
          </button>

          {totalGuestsToSeat === 0 && (
            <p className="text-center text-red-500 mt-4 text-sm font-bold">
              לא נמצאו מוזמנים רלוונטיים. יש להוסיף מוזמנים בעמוד הניהול.
            </p>
          )}
        </div>

        {results && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-wedding-sand pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-wedding-dark">
                  תוצאות השיבוץ ({results.length} שולחנות שובצו)
                </h2>
                {/* מקרא צבעים */}
                <div className="flex gap-4 text-sm font-bold mt-2">
                  <span className="flex items-center gap-1.5 text-green-700">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>{" "}
                    אישרו הגעה
                  </span>
                  <span className="flex items-center gap-1.5 text-yellow-600">
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>{" "}
                    ממתינים לאישור
                  </span>
                </div>
              </div>
              <button
                onClick={handleExportSeatingToExcel}
                className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <span>📊 ייצא הושבה לאולם (Excel)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((table, tableIndex) => (
                <div
                  key={table.id}
                  className="bg-white p-6 rounded-[24px] border border-wedding-sand shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4 border-b border-stone-100 pb-4">
                    <div>
                      <h3 className="font-bold text-wedding-dark text-lg flex items-center gap-2">
                        {table.capacity === 20 ? "👑" : "🍽️"} שולחן{" "}
                        {tableIndex + 1}
                      </h3>
                      <p className="text-xs text-stone-400 mt-1">
                        תפוסה:{" "}
                        <span
                          className={`font-bold ${table.currentSeats === table.capacity ? "text-green-500" : "text-stone-600"}`}
                        >
                          {table.currentSeats} / {table.capacity}
                        </span>
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full border-4 flex items-center justify-center text-[10px] font-black"
                      style={{
                        borderColor:
                          table.currentSeats === table.capacity
                            ? "#22c55e"
                            : "#e7e5e4",
                        color:
                          table.currentSeats === table.capacity
                            ? "#22c55e"
                            : "#78716c",
                      }}
                    >
                      {Math.round((table.currentSeats / table.capacity) * 100)}%
                    </div>
                  </div>

                  <div className="space-y-3 min-h-[150px]">
                    {table.guests.map((guest, idx) => (
                      <div
                        key={idx}
                        // העיצוב המותנה - ירוק למאשרים, צהוב לממתינים
                        className={`flex justify-between items-center text-sm p-2.5 rounded-lg border-r-4 ${
                          guest.status === "Confirmed"
                            ? "bg-green-50/50 border-green-500"
                            : "bg-yellow-50/50 border-yellow-400"
                        }`}
                      >
                        <span className="font-medium text-stone-800">
                          {guest.name}{" "}
                          <span className="text-stone-500 font-bold text-xs ml-1">
                            ({guest.expectedGuests})
                          </span>
                        </span>
                        <div className="flex gap-1.5 items-center">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-stone-200 text-stone-500 shadow-sm">
                            {guest.relationship}
                          </span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${guest.side === "Bride" ? "bg-pink-400" : guest.side === "Groom" ? "bg-blue-400" : "bg-stone-400"}`}
                            title={guest.side}
                          ></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

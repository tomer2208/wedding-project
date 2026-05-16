"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Guest } from "@/types/guest";
import { optimizeSeating, Table } from "@/utils/seatingAlgorithm";
import * as XLSX from "xlsx";
import { getGuests } from "@/app/actions/guests";
import { saveSeatingPlan, loadSeatingPlan } from "@/app/actions/seating"; // הייבוא לטעינה ושמירה

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export default function SeatingPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [results, setResults] = useState<Table[] | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null); // הסטייט למודל האורח
  const [isLoadingPlan, setIsLoadingPlan] = useState(true); // חיווי טעינת סידור קיים

  const [isEditing, setIsEditing] = useState(false);

  const [tableConfig, setTableConfig] = useState({
    count10: 5,
    count12: 5,
    count20: 2,
  });

  // משיכת האורחים וטעינת סידור השולחנות השמור בעליית העמוד
  // שואבים נתונים עם מנגנון קאש חכם
  const { data: guestsRes } = useSWR("guestsList", () => getGuests());
  const { data: planRes } = useSWR("seatingPlan", () => loadSeatingPlan());

  // מסנכרנים את הסטייט המקומי רק כשהנתונים זמינים
  useEffect(() => {
    if (guestsRes?.success && guestsRes.guests) {
      setGuests(guestsRes.guests as Guest[]);
    }

    if (planRes?.success && planRes.data) {
      setResults(planRes.data);
    }

    // אם שני הבקשות סיימו לחזור (או נשלפו מהקאש), עוצרים את חיווי הטעינה
    if (guestsRes && planRes) {
      setIsLoadingPlan(false);
      setMounted(true);
    }
  }, [guestsRes, planRes]);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setResults(null);
    setIsEditing(false);
    const guestsToSeat = guests.filter((g) => g.status !== "Declined");

    setTimeout(async () => {
      const finalTables = optimizeSeating(guestsToSeat, tableConfig);
      setResults(finalTables);
      setIsOptimizing(false);

      // שמירה אוטומטית של הסידור החדש במסד הנתונים
      await saveSeatingPlan(finalTables);
    }, 500);
  };

  const handleExportSeatingToExcel = () => {
    if (!results || results.length === 0) return;
    const exportData: any[][] = [];
    results.forEach((table, tableIndex) => {
      exportData.push([
        `שולחן ${tableIndex + 1} (${table.currentSeats}/${table.capacity} מושבים)`,
      ]);
      exportData.push(["שם האורח/משפחה", "כמות אנשים", "הערות"]);
      table.guests.forEach((guest) => {
        exportData.push([
          guest.name || guest.first_name,
          guest.expectedGuests || guest.invited_count || 1,
          guest.ageGroup === "YoungAdults" ? "צעירים" : "",
        ]);
      });
      exportData.push([]);
      exportData.push([]);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    worksheet["!cols"] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "סידור הושבה");
    XLSX.writeFile(workbook, "סידור_הושבה.xlsx");
  };

  const handleAddTable = (capacity: number) => {
    if (!results) return;
    const newTable: Table = {
      id: `manual-table-${Date.now()}`,
      name: `שולחן חדש (${capacity})`,
      guests: [],
      currentSeats: 0,
      capacity: capacity,
    };
    setResults([...results, newTable]);
  };

  const handleDeleteTable = (tableId: string) => {
    if (!results) return;
    const tableToDelete = results.find((t) => t.id === tableId);
    if (tableToDelete && tableToDelete.guests.length > 0) {
      alert(
        "לא ניתן למחוק שולחן שיש בו אורחים. אנא העבר אותם לשולחן אחר קודם.",
      );
      return;
    }
    setResults(results.filter((t) => t.id !== tableId));
  };

  const handleSaveEdit = async () => {
    if (!results) return;
    const overfilledTables = results.filter((t) => t.currentSeats > t.capacity);
    if (overfilledTables.length > 0) {
      alert(
        `שגיאה בשמירה: יש חריגת מקומות ב-${overfilledTables.length} שולחנות. נא לתקן לפני השמירה.`,
      );
      return;
    }

    // שומר את העריכה הידנית במסד הנתונים
    const res = await saveSeatingPlan(results);
    if (res.success) {
      setIsEditing(false);
      alert("הסידור נשמר בהצלחה! תוכל לחזור אליו בכל עת.");
    } else {
      alert("שגיאה בשמירת הסידור: " + res.error);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    setResults((prevResults) => {
      if (!prevResults) return null;
      const newResults = JSON.parse(JSON.stringify(prevResults));

      const sourceTableIndex = newResults.findIndex(
        (t: Table) => t.id === source.droppableId,
      );
      const destTableIndex = newResults.findIndex(
        (t: Table) => t.id === destination.droppableId,
      );

      const sourceTable = newResults[sourceTableIndex];
      const destTable = newResults[destTableIndex];

      const [movedGuest] = sourceTable.guests.splice(source.index, 1);
      destTable.guests.splice(destination.index, 0, movedGuest);

      const guestCount =
        Number(movedGuest.expectedGuests) ||
        Number(movedGuest.invited_count) ||
        1;

      if (sourceTableIndex !== destTableIndex) {
        sourceTable.currentSeats -= guestCount;
        destTable.currentSeats += guestCount;
      }

      return newResults;
    });
  };

  const getDynamicColor = (text: string) => {
    if (!text) text = "אחר";
    const colors = [
      "bg-blue-100 text-blue-700 border-blue-200",
      "bg-purple-100 text-purple-700 border-purple-200",
      "bg-emerald-100 text-emerald-700 border-emerald-200",
      "bg-orange-100 text-orange-700 border-orange-200",
      "bg-rose-100 text-rose-700 border-rose-200",
      "bg-amber-100 text-amber-700 border-amber-200",
      "bg-indigo-100 text-indigo-700 border-indigo-200",
      "bg-teal-100 text-teal-700 border-teal-200",
    ];

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (!mounted || isLoadingPlan)
    return (
      <div className="min-h-screen bg-wedding-beige p-8 pt-32 text-center text-xl text-wedding-brown">
        טוען נתונים...
      </div>
    );

  const totalGuestsToSeat = guests
    .filter((g) => g.status !== "Declined")
    .reduce(
      (acc, g) =>
        acc + (Number(g.expectedGuests) || Number(g.invited_count) || 1),
      0,
    );

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
            הגדרות אולם (מלאי ראשוני)
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
            {isOptimizing ? "מחשב וריאציות הושבה..." : "✨ סדר לנו את האולם!"}
          </button>
        </div>

        {results && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b border-wedding-sand pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-serif font-bold text-wedding-dark flex items-center gap-3">
                  תוצאות השיבוץ ({results.length} שולחנות)
                  {isEditing && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold animate-pulse">
                      מצב עריכה מופעל
                    </span>
                  )}
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleAddTable(10)}
                      className="px-4 py-2 text-sm bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-all border border-stone-200"
                    >
                      + שולחן (10)
                    </button>
                    <button
                      onClick={() => handleAddTable(12)}
                      className="px-4 py-2 text-sm bg-stone-100 text-stone-600 font-bold rounded-xl hover:bg-stone-200 transition-all border border-stone-200"
                    >
                      + שולחן (12)
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-sm"
                    >
                      💾 שמור שינויים
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2.5 bg-wedding-dark text-wedding-beige font-bold rounded-xl hover:bg-stone-800 transition-all shadow-sm"
                    >
                      ✏️ עריכה ידנית
                    </button>
                    <button
                      onClick={handleExportSeatingToExcel}
                      className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm"
                    >
                      📊 ייצא לאקסל
                    </button>
                  </>
                )}
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((table, tableIndex) => (
                  <Droppable
                    key={table.id}
                    droppableId={table.id}
                    isDropDisabled={!isEditing}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`bg-white p-6 rounded-[24px] border transition-all ${
                          snapshot.isDraggingOver
                            ? "border-wedding-dark shadow-lg bg-stone-50 scale-[1.02]"
                            : "border-wedding-sand shadow-sm hover:shadow-md"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4 border-b border-stone-100 pb-4">
                          <div>
                            <h3 className="font-bold text-wedding-dark text-lg flex items-center gap-2">
                              {table.capacity === 20 ? "👑" : "🍽️"}{" "}
                              {table.name || `שולחן ${tableIndex + 1}`}
                            </h3>
                            <p className="text-xs text-stone-400 mt-1">
                              תפוסה:{" "}
                              <span
                                className={`font-bold ${table.currentSeats === table.capacity ? "text-green-500" : table.currentSeats > table.capacity ? "text-red-500 text-base" : "text-stone-600"}`}
                              >
                                {table.currentSeats} / {table.capacity}
                              </span>
                              {table.currentSeats > table.capacity && (
                                <span className="text-red-500 font-bold ml-1">
                                  (חריגה!)
                                </span>
                              )}
                            </p>
                          </div>

                          {isEditing && table.guests.length === 0 && (
                            <button
                              onClick={() => handleDeleteTable(table.id)}
                              className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                              title="מחק שולחן ריק"
                            >
                              🗑️
                            </button>
                          )}
                        </div>

                        <div className="space-y-3 min-h-[100px]">
                          {table.guests.map((guest, idx) => (
                            <Draggable
                              key={`${table.id}-${guest.name || guest.first_name}-${idx}`}
                              draggableId={`${table.id}-${guest.name || guest.first_name}-${idx}`}
                              index={idx}
                              isDragDisabled={!isEditing}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() =>
                                    !isEditing && setSelectedGuest(guest)
                                  }
                                  className={`flex justify-between items-center text-sm p-2.5 rounded-lg border-r-4 transition-all select-none ${
                                    !isEditing
                                      ? "opacity-90 cursor-pointer hover:bg-stone-50"
                                      : snapshot.isDragging
                                        ? "shadow-xl opacity-100 rotate-2 scale-105 z-50 cursor-grabbing bg-white"
                                        : "cursor-grab hover:bg-stone-50"
                                  } ${
                                    guest.status === "Confirmed"
                                      ? "bg-green-50/30 border-green-500"
                                      : "bg-yellow-50/30 border-yellow-400"
                                  }`}
                                  style={provided.draggableProps.style}
                                >
                                  <span className="font-bold text-stone-800">
                                    {guest.name || guest.first_name}{" "}
                                    <span className="text-stone-500 font-bold text-xs ml-1">
                                      (
                                      {guest.expectedGuests ||
                                        guest.invited_count}
                                      )
                                    </span>
                                  </span>

                                  <div className="flex gap-2 items-center">
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold shadow-sm ${getDynamicColor(guest.relationship || "אחר")}`}
                                    >
                                      {guest.relationship || "אחר"}
                                    </span>
                                    <span
                                      className={`w-3 h-3 rounded-full shadow-sm border border-black/10 ${guest.side === "Bride" ? "bg-pink-400" : guest.side === "Groom" ? "bg-blue-400" : "bg-purple-400"}`}
                                      title={
                                        guest.side === "Bride"
                                          ? "צד כלה"
                                          : guest.side === "Groom"
                                            ? "צד חתן"
                                            : "משותף"
                                      }
                                    ></span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </div>
        )}

        {/* מודל פרטי אורח (Pop-up) */}
        {selectedGuest && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-right transform transition-all">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-3xl font-serif font-bold text-wedding-dark">
                  {selectedGuest.name || selectedGuest.first_name}
                </h3>
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="text-stone-400 hover:text-red-500 transition-colors p-1"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 text-stone-600 mb-8 bg-wedding-beige/30 p-5 rounded-2xl border border-wedding-sand/50">
                <p className="flex items-center gap-3">
                  <span className="text-xl">📞</span>
                  <strong className="text-stone-800">טלפון:</strong>
                  <span className="font-mono text-left w-full" dir="ltr">
                    {selectedGuest.phone || "לא הוזן"}
                  </span>
                </p>
                <div className="h-px bg-wedding-sand/30 w-full"></div>
                <p className="flex items-center gap-3">
                  <span className="text-xl">👥</span>
                  <strong className="text-stone-800">כמות:</strong>{" "}
                  {selectedGuest.expectedGuests || selectedGuest.invited_count}{" "}
                  מקומות
                </p>
                <div className="h-px bg-wedding-sand/30 w-full"></div>
                <p className="flex items-center gap-3">
                  <span className="text-xl">👰</span>
                  <strong className="text-stone-800">צד:</strong>{" "}
                  {selectedGuest.side === "Groom"
                    ? "חתן"
                    : selectedGuest.side === "Bride"
                      ? "כלה"
                      : "משותף"}
                </p>
                <div className="h-px bg-wedding-sand/30 w-full"></div>
                <p className="flex items-center gap-3">
                  <span className="text-xl">🤝</span>
                  <strong className="text-stone-800">קרבה:</strong>{" "}
                  {selectedGuest.relationship || "אחר"}
                </p>
                <div className="h-px bg-wedding-sand/30 w-full"></div>
                <p className="flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <strong className="text-stone-800">סטטוס:</strong>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedGuest.status === "Confirmed" ? "bg-green-100 text-green-700" : selectedGuest.status === "Declined" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {selectedGuest.status === "Confirmed"
                      ? "מגיע"
                      : selectedGuest.status === "Declined"
                        ? "לא מגיע"
                        : "טרם ענה"}
                  </span>
                </p>
                <div className="h-px bg-wedding-sand/30 w-full"></div>
                <p className="flex items-center gap-3">
                  <span className="text-xl">🔥</span>
                  <strong className="text-stone-800">קבוצת גיל:</strong>{" "}
                  {selectedGuest.ageGroup === "YoungAdults"
                    ? "צעיר (אבירים)"
                    : "מבוגר (רגיל)"}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="w-full bg-stone-100 text-stone-800 py-3 rounded-xl hover:bg-stone-200 font-bold transition shadow-sm border border-stone-200"
                >
                  סגור
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

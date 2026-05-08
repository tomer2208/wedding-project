"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Guest } from "@/types/guest";
import { optimizeSeating, Table } from "@/utils/seatingAlgorithm";
import * as XLSX from "xlsx";
import { createClient } from "@/utils/supabase/client";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

export default function SeatingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [results, setResults] = useState<Table[] | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [tableConfig, setTableConfig] = useState({
    count10: 5,
    count12: 5,
    count20: 2,
  });

  useEffect(() => {
    const fetchGuestsAndCheckAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

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
    setIsEditing(false);
    const guestsToSeat = guests.filter((g) => g.status !== "Declined");

    setTimeout(() => {
      const finalTables = optimizeSeating(guestsToSeat, tableConfig);
      setResults(finalTables);
      setIsOptimizing(false);
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

  const handleSaveEdit = () => {
    if (!results) return;
    const overfilledTables = results.filter((t) => t.currentSeats > t.capacity);
    if (overfilledTables.length > 0) {
      alert(
        `שגיאה בשמירה: יש חריגת מקומות ב-${overfilledTables.length} שולחנות. נא לתקן לפני השמירה.`,
      );
      return;
    }
    setIsEditing(false);
    alert("הסידור נשמר בהצלחה!");
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

      if (sourceTableIndex !== destTableIndex) {
        sourceTable.currentSeats -= movedGuest.expectedGuests;
        destTable.currentSeats += movedGuest.expectedGuests;
      }

      return newResults;
    });
  };

  // פונקציית עזר להחזרת צבע לפי סוג הקרבה
  const getRelationshipColor = (rel: string) => {
    switch (rel) {
      case "Family":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Friends":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Army":
        return "bg-green-100 text-green-700 border-green-200";
      case "Work":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Study":
        return "bg-teal-100 text-teal-700 border-teal-200";
      default:
        return "bg-stone-100 text-stone-600 border-stone-200";
    }
  };

  if (!mounted) return null;

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
            {isOptimizing
              ? "מחשב 20,000 וריאציות הושבה..."
              : "✨ סדר לנו את האולם!"}
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
                              key={`${table.id}-${guest.name}-${idx}`}
                              draggableId={`${table.id}-${guest.name}-${idx}`}
                              index={idx}
                              isDragDisabled={!isEditing}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`flex justify-between items-center text-sm p-2.5 rounded-lg border-r-4 transition-all select-none ${
                                    !isEditing
                                      ? "opacity-90 cursor-default"
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
                                    {guest.name}{" "}
                                    <span className="text-stone-500 font-bold text-xs ml-1">
                                      ({guest.expectedGuests})
                                    </span>
                                  </span>

                                  {/* ======= כאן הוספנו את הצבעים הדינמיים והחזרנו את הנקודה! ======= */}
                                  <div className="flex gap-2 items-center">
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold shadow-sm ${getRelationshipColor(guest.relationship)}`}
                                    >
                                      {guest.relationship}
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
      </div>
    </div>
  );
}

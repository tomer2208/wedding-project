"use client";

import React, { useState, useEffect } from "react";
import { ExcelImport } from "@/components/ExcelImport";
import { Guest } from "@/types/guest";
import { createClient } from "../../utils/supabase/client";

const sideMap: Record<string, string> = {
  Bride: "צד כלה",
  Groom: "צד חתן",
  Joint: "משותף",
};

const statusMap: Record<string, { label: string; color: string }> = {
  Pending: {
    label: "מחכה לאישור",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  Confirmed: {
    label: "אישר/ה הגעה",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  Declined: {
    label: "סירב/ה",
    color: "bg-red-100 text-red-800 border-red-200",
  },
};

const ageGroupMap: Record<string, string> = {
  Adults: "מבוגרים",
  YoungAdults: "צעירים (אבירים)",
  Kids: "ילדים",
};

const relationshipMap: Record<string, string> = {
  ImmediateFamily: "משפחה קרובה",
  ExtendedFamily: "משפחה מורחבת",
  Friends: "חברים",
  Army: "צבא",
  Work: "עבודה",
  Study: "לימודים",
  ParentsGuests: "אורחי הורים",
  Other: "אחר",
};

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualGuest, setManualGuest] = useState<Partial<Guest>>({
    name: "",
    phone: "",
    expectedGuests: 1,
    side: "Joint",
    relationship: "Other",
    ageGroup: "Adults",
    status: "Pending",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Guest>>({});

  useEffect(() => {
    const fetchGuests = async () => {
      const { data, error } = await supabase.from("guests").select("*");
      if (error) console.error("Error fetching guests:", error);
      else if (data) setGuests(data as Guest[]);
      setIsLoaded(true);
    };
    fetchGuests();
  }, [supabase]);

  const handleImportGuests = async (importedGuests: Guest[]) => {
    const { error } = await supabase.from("guests").insert(importedGuests);
    if (!error) setGuests((prev) => [...prev, ...importedGuests]);
    else alert("הייתה שגיאה בשמירת האורחים מהאקסל");
  };

  const handleDeleteGuest = async (id: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק אורח זה?")) {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (!error) setGuests((prev) => prev.filter((g) => g.id !== id));
    }
  };

  const handleSaveManualGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualGuest.name) return;

    const newGuest: Guest = {
      id: Math.random().toString(36).substr(2, 9),
      name: manualGuest.name,
      phone: manualGuest.phone || "",
      expectedGuests: Number(manualGuest.expectedGuests) || 1,
      side: manualGuest.side as Guest["side"],
      relationship: manualGuest.relationship as Guest["relationship"],
      ageGroup: manualGuest.ageGroup as Guest["ageGroup"],
      status: manualGuest.status as Guest["status"],
    };

    const { error } = await supabase.from("guests").insert([newGuest]);
    if (!error) {
      setGuests((prev) => [newGuest, ...prev]);
      setIsAddingManual(false);
      setManualGuest({
        name: "",
        phone: "",
        expectedGuests: 1,
        side: "Joint",
        relationship: "Other",
        ageGroup: "Adults",
        status: "Pending",
      });
    }
  };

  const handleStartEdit = (guest: Guest) => {
    setEditingId(guest.id);
    setEditFormData({ ...guest });
  };

  const handleQuickStatusUpdate = async (
    id: string,
    newStatus: Guest["status"],
  ) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g)),
    );

    const { error } = await supabase
      .from("guests")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error);
      alert("שגיאה בעדכון הסטטוס בענן");
    }
  };

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase
      .from("guests")
      .update(editFormData)
      .eq("id", id);
    if (!error) {
      setGuests((prev) =>
        prev.map((g) =>
          g.id === id ? ({ ...g, ...editFormData } as Guest) : g,
        ),
      );
      setEditingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("זהירות! פעולה זו תמחק את הכל. האם אתה בטוח?")) {
      const { error } = await supabase.from("guests").delete().neq("id", "0");
      if (!error) setGuests([]);
    }
  };

  const sendWhatsAppInvitation = (guest: Guest) => {
    if (!guest.phone) {
      alert("לא הוזן מספר טלפון לאורח זה.");
      return;
    }

    // מנקה את מספר הטלפון מתווים מיותרים
    const cleanPhone = guest.phone.replace(/\D/g, "");

    // הלינק האמיתי כולל https:// כדי שיהיה לחיץ בוואטסאפ!
    const rsvpLink = `https://wedding-project-omega-flame.vercel.app/rsvp`;

    // ניסוח ההודעה
    const message = `היי ${guest.name} ✨
מה קורה? אנחנו מתרגשים מאוד להזמין אתכם לחתונה שלנו שתתקיים ב-2.6.26! 🥂

נשמח מאוד אם תוכלו לאשר הגעה בקישור הבא כדי שנוכל להיערך בהתאם:
${rsvpLink}

אוהבים, סיוון ותומר ❤️`;

    // פתיחת חלון וואטסאפ עם ההודעה המקודדת
    window.open(
      `https://wa.me/972${cleanPhone.substring(1)}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const totalGuests = guests.reduce((sum, g) => sum + g.expectedGuests, 0);
  const confirmedGuests = guests
    .filter((g) => g.status === "Confirmed")
    .reduce((sum, g) => sum + g.expectedGuests, 0);

  if (!isLoaded) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 pt-24 space-y-10" dir="rtl">
      {/* כותרת וסטטיסטיקה */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-stone-50 p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-wedding-dark">
            ניהול מוזמנים (מחובר לענן ☁️)
          </h1>
          <p className="text-stone-500 mt-1">
            העלו, ערכו ונהלו את רשימת האורחים שלכם
          </p>
        </div>
        <div className="flex gap-8">
          <div className="text-center">
            <span className="block text-4xl font-black text-wedding-brown">
              {totalGuests}
            </span>
            <span className="text-sm font-bold text-stone-500">
              סה"כ מוזמנים
            </span>
          </div>
          <div className="text-center">
            <span className="block text-4xl font-black text-green-600">
              {confirmedGuests}
            </span>
            <span className="text-sm font-bold text-stone-500">אישרו הגעה</span>
          </div>
        </div>
      </div>

      <section>
        <ExcelImport onImport={handleImportGuests} />
      </section>

      <section className="border-t border-stone-200 pt-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-wedding-dark">
            רשימת האורחים ({guests.length})
          </h2>
          <div className="flex gap-3">
            {guests.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="px-5 py-2.5 border-2 border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-all"
              >
                🗑️ מחק הכל
              </button>
            )}
            <button
              onClick={() => setIsAddingManual(!isAddingManual)}
              className="px-5 py-2.5 bg-wedding-dark text-wedding-beige font-bold rounded-xl hover:bg-stone-700 transition-all"
            >
              {isAddingManual ? "✕ סגור" : "➕ הוספת אורח ידנית"}
            </button>
          </div>
        </div>

        {/* טופס הוספה ידנית מעודכן עם קרבה וקבוצת גיל */}
        {isAddingManual && (
          <form
            onSubmit={handleSaveManualGuest}
            className="bg-stone-50 p-6 rounded-2xl border border-stone-200 mb-8 shadow-inner animate-in fade-in slide-in-from-top-4 duration-300"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  שם האורח/משפחה *
                </label>
                <input
                  required
                  type="text"
                  value={manualGuest.name}
                  onChange={(e) =>
                    setManualGuest({ ...manualGuest, name: e.target.value })
                  }
                  className="w-full border-stone-300 rounded-lg p-2.5 border outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  טלפון
                </label>
                <input
                  type="text"
                  value={manualGuest.phone}
                  onChange={(e) =>
                    setManualGuest({ ...manualGuest, phone: e.target.value })
                  }
                  className="w-full border-stone-300 rounded-lg p-2.5 border outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  כמות
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={manualGuest.expectedGuests}
                  onChange={(e) =>
                    setManualGuest({
                      ...manualGuest,
                      expectedGuests: Number(e.target.value),
                    })
                  }
                  className="w-full border-stone-300 rounded-lg p-2.5 border outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  צד
                </label>
                <select
                  value={manualGuest.side}
                  onChange={(e) =>
                    setManualGuest({
                      ...manualGuest,
                      side: e.target.value as Guest["side"],
                    })
                  }
                  className="w-full border-stone-300 rounded-lg p-2.5 border bg-white"
                >
                  {Object.entries(sideMap).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {/* --- שדה קרבה חסר --- */}
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  קרבה
                </label>
                <select
                  value={manualGuest.relationship}
                  onChange={(e) =>
                    setManualGuest({
                      ...manualGuest,
                      relationship: e.target.value as Guest["relationship"],
                    })
                  }
                  className="w-full border-stone-300 rounded-lg p-2.5 border bg-white outline-none focus:border-wedding-brown"
                >
                  {Object.entries(relationshipMap).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {/* --- שדה קבוצת גיל חסר --- */}
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  קבוצת גיל
                </label>
                <select
                  value={manualGuest.ageGroup}
                  onChange={(e) =>
                    setManualGuest({
                      ...manualGuest,
                      ageGroup: e.target.value as Guest["ageGroup"],
                    })
                  }
                  className="w-full border-stone-300 rounded-lg p-2.5 border bg-white outline-none focus:border-wedding-brown"
                >
                  {Object.entries(ageGroupMap).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  סטטוס הגעה
                </label>
                <select
                  value={manualGuest.status}
                  onChange={(e) =>
                    setManualGuest({
                      ...manualGuest,
                      status: e.target.value as Guest["status"],
                    })
                  }
                  className="w-full border-stone-300 rounded-lg p-2.5 border bg-white font-bold"
                >
                  {Object.entries(statusMap).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-4 md:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-wedding-brown text-white font-bold rounded-xl hover:bg-stone-600 shadow-sm"
                >
                  💾 שמור
                </button>
              </div>
            </div>
          </form>
        )}

        {/* טבלת האורחים עם סטטוס אינטראקטיבי */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium text-sm">
                <tr>
                  <th className="p-4">שם האורח/ת</th>
                  <th className="p-4 w-20">כמות</th>
                  <th className="p-4">קרבה וצד</th>
                  <th className="p-4">קבוצת גיל</th>
                  <th className="p-4">סטטוס הגעה</th>
                  <th className="p-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {guests.map((guest) => (
                  <tr
                    key={guest.id}
                    className={`transition-colors ${editingId === guest.id ? "bg-wedding-sand/10" : "hover:bg-stone-50/50"}`}
                  >
                    {editingId === guest.id ? (
                      /* מצב עריכה מלא */
                      <>
                        <td className="p-3">
                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                name: e.target.value,
                              })
                            }
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={editFormData.expectedGuests}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                expectedGuests: Number(e.target.value),
                              })
                            }
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="p-3 space-y-1">
                          {/* הוספתי שדה קרבה לעריכה */}
                          <select
                            value={editFormData.relationship}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                relationship: e.target
                                  .value as Guest["relationship"],
                              })
                            }
                            className="w-full p-1 text-xs border rounded"
                          >
                            {Object.entries(relationshipMap).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editFormData.side}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                side: e.target.value as Guest["side"],
                              })
                            }
                            className="w-full p-1 border rounded text-xs"
                          >
                            {Object.entries(sideMap).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          {/* הוספתי קבוצת גיל לעריכה */}
                          <select
                            value={editFormData.ageGroup}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                ageGroup: e.target.value as Guest["ageGroup"],
                              })
                            }
                            className="w-full p-1 text-xs border rounded"
                          >
                            {Object.entries(ageGroupMap).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td
                          className="p-3 text-center space-x-2 space-x-reverse"
                          colSpan={2}
                        >
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleSaveEdit(guest.id)}
                              className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded shadow-sm hover:bg-green-600"
                            >
                              שמור
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-stone-300 text-stone-700 text-xs font-bold rounded shadow-sm hover:bg-stone-400"
                            >
                              בטל
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      /* מצב תצוגה רגיל עם סטטוס משתנה */
                      <>
                        <td className="p-4">
                          <div className="font-bold text-stone-800">
                            {guest.name}
                          </div>
                          <div className="text-xs text-stone-400">
                            {guest.phone}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-lg">
                          {guest.expectedGuests}
                        </td>
                        <td className="p-4 text-xs text-stone-600">
                          {relationshipMap[guest.relationship]} <br />
                          <span className="text-stone-400">
                            {sideMap[guest.side]}
                          </span>
                        </td>
                        <td className="p-4">
                          {guest.ageGroup === "YoungAdults" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wedding-sand/30 text-wedding-brown font-bold text-sm">
                              🍻 {ageGroupMap[guest.ageGroup]}
                            </span>
                          ) : (
                            <span className="text-stone-600 text-sm">
                              {ageGroupMap[guest.ageGroup]}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {/* ה-Select החדש לעדכון מהיר */}
                          <select
                            value={guest.status}
                            onChange={(e) =>
                              handleQuickStatusUpdate(
                                guest.id,
                                e.target.value as Guest["status"],
                              )
                            }
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer outline-none transition-all shadow-sm ${statusMap[guest.status].color}`}
                          >
                            {Object.entries(statusMap).map(
                              ([key, { label }]) => (
                                <option
                                  key={key}
                                  value={key}
                                  className="bg-white text-stone-800"
                                >
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-4">
                            <button
                              onClick={() => sendWhatsAppInvitation(guest)}
                              className="text-green-500 hover:scale-110 transition-transform"
                              title="שלח וואטסאפ"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                fill="currentColor"
                                viewBox="0 0 16 16"
                              >
                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleStartEdit(guest)}
                              className="text-stone-400 hover:text-wedding-brown transition-colors"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteGuest(guest.id)}
                              className="text-stone-400 hover:text-red-500 transition-colors"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import React, { useState, useRef, useMemo } from "react";
import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { Guest } from "@/types/guest";
import * as XLSX from "xlsx";

// מילון תרגום לתצוגה בטבלה
const relationshipMap: Record<string, string> = {
  ImmediateFamily: "משפחה גרעינית",
  ExtendedFamily: "משפחה מורחבת",
  Friends: "חברים",
  Army: "צבא",
  Work: "עבודה",
  Study: "לימודים",
  ParentsGuests: "מוזמני הורים",
  Other: "אחר",
};

type GuestFormData = {
  name: string;
  phone: string;
  side: "Bride" | "Groom" | "Joint";
  relationship:
    | "ImmediateFamily"
    | "ExtendedFamily"
    | "Friends"
    | "Army"
    | "Work"
    | "Study"
    | "ParentsGuests"
    | "Other";
  ageGroup: "Adults" | "YoungAdults" | "Kids";
  expectedGuests: number;
};

export default function GuestsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const defaultGuestState: GuestFormData = {
    name: "",
    phone: "",
    side: "Bride",
    relationship: "ImmediateFamily",
    ageGroup: "Adults",
    expectedGuests: 1,
  };

  const [newGuest, setNewGuest] = useState<GuestFormData>(defaultGuestState);

  // --- 1. שליפת נתונים ---
  const fetchGuests = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return [];
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("user_id", session.user.id);
    if (error) throw error;
    return data as Guest[];
  };
  const { data: guests = [], mutate } = useSWR<Guest[]>(
    "guests_list",
    fetchGuests,
  );

  const fetchProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;
    const { data } = await supabase
      .from("profiles")
      .select("slug")
      .eq("id", session.user.id)
      .single();
    return data;
  };
  const { data: profile } = useSWR("user_profile", fetchProfile);

  // --- 2. רובליקות (מדדים) ---
  const stats = useMemo(
    () => ({
      total: guests.reduce((sum, g) => sum + (g.expectedGuests || 0), 0),
      confirmed: guests
        .filter((g) => g.status === "Confirmed")
        .reduce((sum, g) => sum + (g.expectedGuests || 0), 0),
      pending: guests
        .filter((g) => g.status === "Pending")
        .reduce((sum, g) => sum + (g.expectedGuests || 0), 0),
    }),
    [guests],
  );

  // --- 3. לוגיקת האקסל המשופרת ---

  // פונקציה חכמה לניקוי ומציאת ערכים לפי מילות מפתח
  const getSmartValue = (row: any, keywords: string[]) => {
    const keys = Object.keys(row);
    for (const key of keys) {
      // ניקוי תווים בלתי נראים ורווחים משני הצדדים
      const cleanKey = key
        .trim()
        .toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/g, "");
      if (keywords.some((kw) => cleanKey.includes(kw.toLowerCase()))) {
        return row[key];
      }
    }
    return undefined;
  };

  // פונקציית מיפוי קרבה הרבה יותר גמישה
  const parseRelationship = (val: any): Guest["relationship"] => {
    if (!val) return "Other";
    const s = String(val).trim().toLowerCase();

    // בדיקה אם זה כבר מפתח באנגלית
    const englishKeys: Record<string, Guest["relationship"]> = {
      immediatefamily: "ImmediateFamily",
      extendedfamily: "ExtendedFamily",
      friends: "Friends",
      army: "Army",
      work: "Work",
      study: "Study",
      parentsguests: "ParentsGuests",
      other: "Other",
    };
    if (englishKeys[s]) return englishKeys[s];

    // זיהוי לפי מילות מפתח בעברית
    if (
      s.includes("גרעינית") ||
      s.includes("קרוב") ||
      s.includes("אחים") ||
      (s.includes("הורים") && !s.includes("מוזמני"))
    )
      return "ImmediateFamily";
    if (
      s.includes("מורחבת") ||
      s.includes("משפחה") ||
      s.includes("דוד") ||
      s.includes("סבא") ||
      s.includes("סבתא")
    )
      return "ExtendedFamily";
    if (s.includes("חבר") || s.includes("ידיד")) return "Friends";
    if (s.includes("עבודה") || s.includes("משרד") || s.includes("קולגה"))
      return "Work";
    if (s.includes("צבא") || s.includes("מילואים") || s.includes("צוות"))
      return "Army";
    if (
      s.includes("לימוד") ||
      s.includes("תואר") ||
      s.includes("אוניברסיטה") ||
      s.includes("מכללה") ||
      s.includes("סטודנט") ||
      s.includes("mta")
    )
      return "Study";
    if (s.includes("מוזמני") || s.includes("אורחי הורים"))
      return "ParentsGuests";

    return "Other";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        const mappedGuests = data.map((item: any) => {
          // זיהוי צד (Bride/Groom/Joint)
          const rawSide = String(
            getSmartValue(item, ["צד", "side", "חתן", "כלה"]) || "",
          ).trim();
          let side: Guest["side"] = "Joint";
          if (rawSide.includes("חתן") || rawSide.toLowerCase() === "groom")
            side = "Groom";
          else if (rawSide.includes("כלה") || rawSide.toLowerCase() === "bride")
            side = "Bride";

          // זיהוי קרבה
          const rawRel = getSmartValue(item, [
            "קשר",
            "קרבה",
            "relationship",
            "relation",
            "סוג",
          ]);

          return {
            id: crypto.randomUUID(),
            user_id: session.user.id,
            name: String(
              getSmartValue(item, ["שם", "אורח", "name"]) || "ללא שם",
            ).trim(),
            phone: String(
              getSmartValue(item, ["טלפון", "נייד", "phone", "mobile"]) || "",
            ).trim(),
            expectedGuests:
              Number(getSmartValue(item, ["כמות", "מוזמנים", "כמה", "qty"])) ||
              1,
            side,
            relationship: parseRelationship(rawRel),
            ageGroup: "Adults",
            status: "Pending",
          };
        });

        const { error: insertError } = await supabase
          .from("guests")
          .insert(mappedGuests);
        if (insertError) throw insertError;

        mutate();
        alert(`הייבוא הושלם! יובאו ${mappedGuests.length} אורחים.`);
      } catch (err) {
        console.error(err);
        alert("שגיאה בייבוא. וודאו שהעמודות באקסל ברורות.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- 4. שאר הפונקציות ---
  const handleOpenEdit = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setNewGuest({
      name: guest.name,
      phone: guest.phone || "",
      side: guest.side,
      relationship: guest.relationship,
      ageGroup: guest.ageGroup || "Adults",
      expectedGuests: guest.expectedGuests || 1,
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteAll = async () => {
    if (!confirm("⚠️ מחיקת כל האורחים לצמיתות? הפעולה לא ניתנת לביטול!"))
      return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase
      .from("guests")
      .delete()
      .eq("user_id", session.user.id);
    if (error) alert("מחיקה נכשלה");
    mutate([]);
  };

  const handleSendWhatsApp = (guest: Guest) => {
    if (!guest.phone) return alert("אין טלפון");
    const slug = profile?.slug || "wedding";
    const cleanPhone = guest.phone.replace(/\D/g, "").startsWith("0")
      ? "972" + guest.phone.replace(/\D/g, "").slice(1)
      : guest.phone.replace(/\D/g, "");
    const rsvpLink = `https://wedding-project-omega-flame.vercel.app/${slug}/rsvp/${guest.id}`;
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`היי ${guest.name}! נשמח לראותכם בחתונה שלנו ב-2.6 💍 אנא אשרו הגעה כאן: ${rsvpLink}`)}`,
      "_blank",
    );
  };

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    if (editingGuestId) {
      const { error } = await supabase
        .from("guests")
        .update(newGuest)
        .eq("id", editingGuestId);
      if (error) alert("עדכון נכשל");
    } else {
      const { error } = await supabase.from("guests").insert([
        {
          ...newGuest,
          id: crypto.randomUUID(),
          user_id: session.user.id,
          status: "Pending",
        },
      ]);
      if (error) alert("הוספה נכשלה");
    }
    setIsAddModalOpen(false);
    mutate();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        שם: "ישראל ישראלי",
        טלפון: "0501234567",
        צד: "חתן",
        קרבה: "חברים",
        כמות: 2,
      },
      {
        שם: "משפחת כהן",
        טלפון: "0541112233",
        צד: "כלה",
        קרבה: "משפחה גרעינית",
        כמות: 4,
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "אורחים");
    XLSX.writeFile(wb, "template_wedding_guests.xlsx");
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6 pt-24 space-y-10" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* 📊 רובליקות המדדים */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[40px] border shadow-sm flex flex-col items-center">
            <span className="text-stone-400 font-bold text-sm mb-2 uppercase tracking-wide">
              סה"כ מוזמנים
            </span>
            <span className="text-5xl font-black text-wedding-dark">
              {stats.total}
            </span>
          </div>
          <div className="bg-green-50 p-8 rounded-[40px] border border-green-100 shadow-sm flex flex-col items-center">
            <span className="text-green-600 font-bold text-sm mb-2 uppercase tracking-wide">
              אישרו הגעה
            </span>
            <span className="text-5xl font-black text-green-700">
              {stats.confirmed}
            </span>
          </div>
          <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 shadow-sm flex flex-col items-center">
            <span className="text-blue-600 font-bold text-sm mb-2 uppercase tracking-wide">
              ממתינים לתשובה
            </span>
            <span className="text-5xl font-black text-blue-700">
              {stats.pending}
            </span>
          </div>
        </div>

        <header className="bg-white p-8 rounded-[32px] border shadow-sm flex flex-wrap justify-between items-center gap-6">
          <h1 className="text-3xl font-bold text-wedding-dark tracking-tight">
            ניהול מוזמנים
          </h1>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setEditingGuestId(null);
                setNewGuest(defaultGuestState);
                setIsAddModalOpen(true);
              }}
              className="px-6 py-3 bg-wedding-dark text-white font-bold rounded-2xl shadow-lg hover:bg-stone-800 transition-all active:scale-95"
            >
              + הוסף אורח
            </button>
            <button
              onClick={downloadTemplate}
              className="px-6 py-3 bg-white text-stone-600 font-bold rounded-2xl border border-stone-200 hover:bg-stone-50 transition-all"
            >
              📄 הורד טמפלט
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-6 py-3 bg-green-50 text-green-700 font-bold rounded-2xl border border-green-200 hover:bg-green-100 transition-all disabled:opacity-50"
            >
              {isUploading ? "מעלה..." : "📥 ייבא אקסל"}
            </button>
            <button
              onClick={handleDeleteAll}
              className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-100 transition-all"
            >
              🗑️ מחק הכל
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".xlsx,.xls,.csv"
            />
          </div>
        </header>

        <div className="bg-white rounded-[32px] shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead className="bg-stone-50/50 border-b border-stone-200">
              <tr>
                <th className="p-6 font-bold text-stone-600 text-sm">
                  שם וטלפון
                </th>
                <th className="p-6 font-bold text-stone-600 text-sm">צד</th>
                <th className="p-6 font-bold text-stone-600 text-sm">קרבה</th>
                <th className="p-6 font-bold text-stone-600 text-sm text-center">
                  כמות
                </th>
                <th className="p-6 font-bold text-stone-600 text-sm text-center">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {guests.map((guest) => (
                <tr
                  key={guest.id}
                  className="hover:bg-stone-50/50 group transition-colors"
                >
                  <td className="p-6">
                    <div className="font-bold text-stone-800 text-lg">
                      {guest.name}
                    </div>
                    <div
                      className="text-sm text-stone-400 font-mono mt-0.5"
                      dir="ltr"
                    >
                      {guest.phone}
                    </div>
                  </td>
                  <td className="p-6">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${guest.side === "Bride" ? "bg-pink-100 text-pink-700" : guest.side === "Groom" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}
                    >
                      {guest.side === "Bride"
                        ? "כלה 👰"
                        : guest.side === "Groom"
                          ? "חתן 🤵"
                          : "משותף 🤝"}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="text-sm text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl font-medium">
                      {relationshipMap[guest.relationship] ||
                        guest.relationship}
                    </span>
                  </td>
                  <td className="p-6 text-center font-black text-wedding-dark text-xl">
                    {guest.expectedGuests}
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button
                        onClick={() => handleSendWhatsApp(guest)}
                        className="w-10 h-10 bg-green-50 text-green-600 rounded-full hover:bg-green-100 flex items-center justify-center transition-colors shadow-sm"
                        title="שלח הודעה"
                      >
                        📲
                      </button>
                      <button
                        onClick={() => handleOpenEdit(guest)}
                        className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 flex items-center justify-center transition-colors shadow-sm"
                        title="ערוך אורח"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {guests.length === 0 && (
            <div className="p-20 text-center text-stone-400">
              <div className="text-4xl mb-3">📋</div>
              <p>אין אורחים ברשימה. הגיע הזמן להוסיף!</p>
            </div>
          )}
        </div>
      </div>

      {/* מודל הוספה / עריכה */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black mb-8 text-wedding-dark border-b pb-4">
              {editingGuestId ? "עדכון פרטי אורח" : "הוספת אורח חדש"}
            </h2>
            <form onSubmit={handleSaveGuest} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-stone-500 mb-2 mr-1">
                  שם האורח / משפחה
                </label>
                <input
                  type="text"
                  required
                  value={newGuest.name}
                  onChange={(e) =>
                    setNewGuest({ ...newGuest, name: e.target.value })
                  }
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-wedding-brown transition-colors"
                  placeholder="לדוגמה: משפחת ישראלי"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-500 mb-2 mr-1">
                  מספר טלפון
                </label>
                <input
                  type="tel"
                  value={newGuest.phone}
                  onChange={(e) =>
                    setNewGuest({ ...newGuest, phone: e.target.value })
                  }
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-wedding-brown transition-colors"
                  placeholder="05X-XXXXXXX"
                  dir="ltr"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-2 mr-1">
                    צד
                  </label>
                  <select
                    value={newGuest.side}
                    onChange={(e) =>
                      setNewGuest({ ...newGuest, side: e.target.value as any })
                    }
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none appearance-none cursor-pointer"
                  >
                    <option value="Bride">כלה</option>
                    <option value="Groom">חתן</option>
                    <option value="Joint">משותף</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-2 mr-1">
                    קרבה
                  </label>
                  <select
                    value={newGuest.relationship}
                    onChange={(e) =>
                      setNewGuest({
                        ...newGuest,
                        relationship: e.target.value as any,
                      })
                    }
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none appearance-none cursor-pointer"
                  >
                    {Object.entries(relationshipMap).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-500 mb-2 mr-1">
                  כמות מוזמנים
                </label>
                <input
                  type="number"
                  min="1"
                  value={newGuest.expectedGuests}
                  onChange={(e) =>
                    setNewGuest({
                      ...newGuest,
                      expectedGuests: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-wedding-brown"
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-wedding-dark text-white font-bold rounded-2xl shadow-lg hover:bg-stone-800 transition-all active:scale-95"
                >
                  שמור וסגור
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-4 bg-stone-100 text-stone-600 font-bold rounded-2xl hover:bg-stone-200 transition-all"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

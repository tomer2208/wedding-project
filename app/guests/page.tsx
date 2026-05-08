"use client";

import React, { useState, useRef, useMemo } from "react";
import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { Guest } from "@/types/guest";
import * as XLSX from "xlsx";

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

const ageGroupMap: Record<string, string> = {
  Adults: "מבוגרים",
  YoungAdults: "צעירים (שולחן אבירים)",
  Kids: "ילדים",
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
  status: Guest["status"];
};

export default function GuestsPage() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // סטייטים של סינונים
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Confirmed" | "Pending" | "Declined"
  >("All");
  const [sideFilter, setSideFilter] = useState<string>("All");
  const [relationshipFilter, setRelationshipFilter] = useState<string>("All");

  const defaultGuestState: GuestFormData = {
    name: "",
    phone: "",
    side: "Joint",
    relationship: "Other",
    ageGroup: "Adults",
    expectedGuests: 1,
    status: "Pending",
  };

  const [newGuest, setNewGuest] = useState<GuestFormData>(defaultGuestState);

  // --- הוספנו פה לוגים כדי שנוכל לדבג בקונסול ---
  const fetchGuests = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.log("No session found during fetchGuests!");
      return [];
    }

    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching guests:", error);
      throw error;
    }

    console.log("✅ Fetched guests from DB successfully:", data);
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

  const stats = useMemo(
    () => ({
      total: guests.reduce((sum, g) => sum + (g.expectedGuests || 0), 0),
      confirmed: guests
        .filter((g) => g.status === "Confirmed")
        .reduce((sum, g) => sum + (g.expectedGuests || 0), 0),
      pending: guests
        .filter((g) => g.status === "Pending")
        .reduce((sum, g) => sum + (g.expectedGuests || 0), 0),
      declined: guests
        .filter((g) => g.status === "Declined")
        .reduce((sum, g) => sum + (g.expectedGuests || 0), 0),
    }),
    [guests],
  );

  // --- התיקון הקריטי: סינון חסין קריסות (Null-Safe) ---
  const filteredGuests = useMemo(() => {
    if (!guests || guests.length === 0) return [];

    return guests.filter((guest) => {
      // 1. הגנה: הופכים את הערכים למחרוזות בטוחות כדי למנוע קריסת Includes
      const safeName = guest.name ? String(guest.name).toLowerCase() : "";
      const safePhone = guest.phone ? String(guest.phone) : "";
      const searchLower = searchQuery ? searchQuery.toLowerCase() : "";

      // 2. בדיקת חיפוש בטוחה
      const matchesSearch =
        searchLower === "" ||
        safeName.includes(searchLower) ||
        safePhone.includes(searchLower);

      const matchesStatus =
        statusFilter === "All" || guest.status === statusFilter;

      const matchesSide = sideFilter === "All" || guest.side === sideFilter;

      const matchesRelationship =
        relationshipFilter === "All" ||
        guest.relationship === relationshipFilter;

      return (
        matchesSearch && matchesStatus && matchesSide && matchesRelationship
      );
    });
  }, [guests, searchQuery, statusFilter, sideFilter, relationshipFilter]);

  // חישוב דינמי של כמות האנשים המוצגים כרגע בטבלה
  const filteredTotalGuests = useMemo(() => {
    return filteredGuests.reduce((sum, g) => sum + (g.expectedGuests || 0), 0);
  }, [filteredGuests]);

  const getSmartValue = (row: any, keywords: string[]) => {
    const keys = Object.keys(row);
    for (const key of keys) {
      const cleanKey = key
        .trim()
        .toLowerCase()
        .replace(/[\u200B-\u200D\uFEFF]/g, "");
      if (keywords.some((kw) => cleanKey.includes(kw.toLowerCase())))
        return row[key];
    }
    return undefined;
  };

  const parseRelationship = (val: any): Guest["relationship"] => {
    if (!val) return "Other";
    const s = String(val).trim().toLowerCase();
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

  const parseAgeGroup = (val: any): Guest["ageGroup"] => {
    if (!val) return "Adults";
    const s = String(val).trim().toLowerCase();
    if (s.includes("ילד") || s.includes("kids")) return "Kids";
    if (s.includes("צעיר") || s.includes("חברה") || s.includes("young"))
      return "YoungAdults";
    return "Adults";
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
          const rawSide = String(
            getSmartValue(item, ["צד", "side", "חתן", "כלה"]) || "",
          ).trim();
          let side: Guest["side"] = "Joint";
          if (rawSide.includes("חתן") || rawSide.toLowerCase() === "groom")
            side = "Groom";
          else if (rawSide.includes("כלה") || rawSide.toLowerCase() === "bride")
            side = "Bride";

          const rawRel = getSmartValue(item, [
            "קשר",
            "קרבה",
            "relationship",
            "relation",
            "סוג",
          ]);
          const rawAge = getSmartValue(item, [
            "גיל",
            "קבוצת גיל",
            "age",
            "צעירים",
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
            ageGroup: parseAgeGroup(rawAge),
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

  const handleStatusChange = async (guestId: string, newStatus: string) => {
    mutate(
      (currentGuests) =>
        currentGuests?.map((g) =>
          g.id === guestId ? { ...g, status: newStatus as any } : g,
        ),
      false,
    );
    await supabase
      .from("guests")
      .update({ status: newStatus })
      .eq("id", guestId);
    mutate();
  };

  const handleOpenEdit = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setNewGuest({
      name: guest.name,
      phone: guest.phone || "",
      side: guest.side,
      relationship: guest.relationship,
      ageGroup: guest.ageGroup || "Adults",
      expectedGuests: guest.expectedGuests || 1,
      status: guest.status || "Pending",
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteSingle = async (guest: Guest) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את ${guest.name}?`)) return;
    const { error } = await supabase.from("guests").delete().eq("id", guest.id);
    if (error) alert("מחיקה נכשלה");
    else mutate();
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
      const { error } = await supabase
        .from("guests")
        .insert([
          { ...newGuest, id: crypto.randomUUID(), user_id: session.user.id },
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
        גיל: "צעירים",
        כמות: 2,
      },
      {
        שם: "משפחת כהן",
        טלפון: "0541112233",
        צד: "כלה",
        קרבה: "משפחה גרעינית",
        גיל: "מבוגרים",
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            onClick={() => setStatusFilter("All")}
            className={`bg-white p-6 rounded-[32px] border shadow-sm flex flex-col items-center cursor-pointer transition-all hover:scale-105 ${statusFilter === "All" ? "ring-4 ring-stone-200" : "opacity-80"}`}
          >
            <span className="text-stone-400 font-bold text-xs mb-2 uppercase tracking-wide">
              סה"כ מוזמנים
            </span>
            <span className="text-4xl font-black text-wedding-dark">
              {stats.total}
            </span>
          </div>
          <div
            onClick={() => setStatusFilter("Confirmed")}
            className={`bg-green-50 p-6 rounded-[32px] border border-green-100 shadow-sm flex flex-col items-center cursor-pointer transition-all hover:scale-105 ${statusFilter === "Confirmed" ? "ring-4 ring-green-200 opacity-100" : "opacity-70"}`}
          >
            <span className="text-green-600 font-bold text-xs mb-2 uppercase tracking-wide">
              אישרו הגעה
            </span>
            <span className="text-4xl font-black text-green-700">
              {stats.confirmed}
            </span>
          </div>
          <div
            onClick={() => setStatusFilter("Pending")}
            className={`bg-blue-50 p-6 rounded-[32px] border border-blue-100 shadow-sm flex flex-col items-center cursor-pointer transition-all hover:scale-105 ${statusFilter === "Pending" ? "ring-4 ring-blue-200 opacity-100" : "opacity-70"}`}
          >
            <span className="text-blue-600 font-bold text-xs mb-2 uppercase tracking-wide">
              ממתינים
            </span>
            <span className="text-4xl font-black text-blue-700">
              {stats.pending}
            </span>
          </div>
          <div
            onClick={() => setStatusFilter("Declined")}
            className={`bg-red-50 p-6 rounded-[32px] border border-red-100 shadow-sm flex flex-col items-center cursor-pointer transition-all hover:scale-105 ${statusFilter === "Declined" ? "ring-4 ring-red-200 opacity-100" : "opacity-70"}`}
          >
            <span className="text-red-600 font-bold text-xs mb-2 uppercase tracking-wide">
              סירבו
            </span>
            <span className="text-4xl font-black text-red-700">
              {stats.declined}
            </span>
          </div>
        </div>

        <header className="bg-white p-6 md:p-8 rounded-[32px] border shadow-sm flex flex-col xl:flex-row justify-between items-center gap-6">
          <h1 className="text-3xl font-bold text-wedding-dark tracking-tight w-full xl:w-auto">
            ניהול מוזמנים
          </h1>
          <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-end">
            <button
              onClick={() => {
                setEditingGuestId(null);
                setNewGuest(defaultGuestState);
                setIsAddModalOpen(true);
              }}
              className="px-5 py-2.5 bg-wedding-dark text-white font-bold rounded-xl shadow-lg hover:bg-stone-800 transition-all active:scale-95 text-sm"
            >
              + הוסף אורח
            </button>
            <button
              onClick={downloadTemplate}
              className="px-5 py-2.5 bg-white text-stone-600 font-bold rounded-xl border border-stone-200 hover:bg-stone-50 transition-all text-sm"
            >
              📄 טמפלט
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-5 py-2.5 bg-green-50 text-green-700 font-bold rounded-xl border border-green-200 hover:bg-green-100 transition-all disabled:opacity-50 text-sm"
            >
              {isUploading ? "מעלה..." : "📥 ייבא אקסל"}
            </button>
            <button
              onClick={handleDeleteAll}
              className="px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-all text-sm"
            >
              🗑️ מחיקת הכל
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
          {/* סרגל הסינונים והמונה */}
          <div className="p-4 md:p-6 border-b border-stone-100 bg-stone-50/50 flex flex-col xl:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="חיפוש לפי שם או טלפון..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl py-2 px-10 outline-none focus:border-wedding-brown transition-colors text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                  🔍
                </span>
              </div>
              <select
                value={sideFilter}
                onChange={(e) => setSideFilter(e.target.value)}
                className="bg-white border border-stone-200 rounded-xl py-2 px-4 outline-none focus:border-wedding-brown text-sm font-medium text-stone-600 cursor-pointer w-full md:w-auto"
              >
                <option value="All">כל הצדדים</option>
                <option value="Bride">צד כלה 👰</option>
                <option value="Groom">צד חתן 🤵</option>
                <option value="Joint">משותף 🤝</option>
              </select>
              <select
                value={relationshipFilter}
                onChange={(e) => setRelationshipFilter(e.target.value)}
                className="bg-white border border-stone-200 rounded-xl py-2 px-4 outline-none focus:border-wedding-brown text-sm font-medium text-stone-600 cursor-pointer w-full md:w-auto"
              >
                <option value="All">כל הקרבות</option>
                {Object.entries(relationshipMap).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* המונה החי */}
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-stone-200 shadow-sm w-full xl:w-auto justify-center">
              <span className="text-stone-500 text-sm font-bold">מציג:</span>
              <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md text-sm font-black">
                {filteredGuests.length} הזמנות
              </span>
              <span className="text-stone-300">|</span>
              <span className="bg-wedding-dark text-wedding-beige px-2 py-0.5 rounded-md text-sm font-black">
                {filteredTotalGuests} אורחים
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[800px]">
              <thead className="bg-white border-b border-stone-200">
                <tr>
                  <th className="p-6 font-bold text-stone-600 text-sm">
                    שם וטלפון
                  </th>
                  <th className="p-6 font-bold text-stone-600 text-sm">
                    צד וקרבה
                  </th>
                  <th className="p-6 font-bold text-stone-600 text-sm text-center">
                    כמות
                  </th>
                  <th className="p-6 font-bold text-stone-600 text-sm">
                    סטטוס הגעה
                  </th>
                  <th className="p-6 font-bold text-stone-600 text-sm text-center">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredGuests.map((guest) => (
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
                      <div className="flex flex-col gap-2 items-start">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold shadow-sm ${guest.side === "Bride" ? "bg-pink-100 text-pink-700 border border-pink-200" : guest.side === "Groom" ? "bg-blue-100 text-blue-700 border border-blue-200" : "bg-purple-100 text-purple-700 border border-purple-200"}`}
                        >
                          {guest.side === "Bride"
                            ? "כלה 👰"
                            : guest.side === "Groom"
                              ? "חתן 🤵"
                              : "משותף 🤝"}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">
                          {relationshipMap[guest.relationship] ||
                            guest.relationship}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-center font-black text-wedding-dark text-xl">
                      {guest.expectedGuests}
                    </td>
                    <td className="p-6">
                      <select
                        value={guest.status}
                        onChange={(e) =>
                          handleStatusChange(guest.id, e.target.value)
                        }
                        className={`text-sm font-bold rounded-xl px-3 py-2 outline-none cursor-pointer appearance-none border transition-colors ${guest.status === "Confirmed" ? "bg-green-50 text-green-700 border-green-200" : guest.status === "Declined" ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                      >
                        <option value="Pending">ממתינים לתשובה ⏳</option>
                        <option value="Confirmed">אישרו הגעה ✅</option>
                        <option value="Declined">סירבו ❌</option>
                      </select>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleSendWhatsApp(guest)}
                          className="w-9 h-9 bg-green-50 text-green-600 rounded-full hover:bg-green-100 flex items-center justify-center transition-colors shadow-sm"
                          title="שלח הודעה"
                        >
                          📲
                        </button>
                        <button
                          onClick={() => handleOpenEdit(guest)}
                          className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 flex items-center justify-center transition-colors shadow-sm"
                          title="ערוך אורח"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(guest)}
                          className="w-9 h-9 bg-red-50 text-red-500 rounded-full hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors shadow-sm"
                          title="מחק אורח"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredGuests.length === 0 && (
              <div className="p-20 text-center text-stone-400">
                <div className="text-4xl mb-3">📋</div>
                <p>לא נמצאו אורחים תואמים לסינון הנוכחי.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* מודל הוספה / עריכה */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] p-8 md:p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black mb-8 text-wedding-dark border-b pb-4">
              {editingGuestId ? "עדכון פרטי אורח" : "הוספת אורח חדש"}
            </h2>
            <form onSubmit={handleSaveGuest} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-stone-500 mb-2 mr-1">
                    כמות
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
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-stone-500 mb-2 mr-1">
                    סטטוס
                  </label>
                  <select
                    value={newGuest.status}
                    onChange={(e) =>
                      setNewGuest({
                        ...newGuest,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none cursor-pointer"
                  >
                    <option value="Pending">ממתין</option>
                    <option value="Confirmed">אישר</option>
                    <option value="Declined">סירב</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-2">
                  <label className="block text-sm font-bold text-stone-500 mb-2 mr-1">
                    קבוצת גיל
                  </label>
                  <select
                    value={newGuest.ageGroup}
                    onChange={(e) =>
                      setNewGuest({
                        ...newGuest,
                        ageGroup: e.target.value as any,
                      })
                    }
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none cursor-pointer"
                  >
                    {Object.entries(ageGroupMap).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
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
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none cursor-pointer"
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
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none cursor-pointer"
                  >
                    {Object.entries(relationshipMap).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-wedding-dark text-white font-bold rounded-2xl shadow-lg hover:bg-stone-800 transition-all active:scale-95"
                >
                  שמור אורח
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

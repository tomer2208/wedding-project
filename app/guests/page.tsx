"use client";

import { useState, useEffect } from "react";
import { Guest } from "@/types/guest";
import { ExcelImport } from "@/components/ExcelImport";

export default function GuestsPage() {
  const [mounted, setMounted] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formGuest, setFormGuest] = useState({
    name: "",
    phone: "",
    side: "Joint" as Guest["side"],
    relationship: "Other" as Guest["relationship"],
    expectedGuests: 1,
  });

  useEffect(() => {
    setMounted(true);
    const savedGuests = localStorage.getItem("wedding_guests");
    if (savedGuests) {
      try {
        setGuests(JSON.parse(savedGuests));
      } catch (e) {
        console.error("Failed to parse guests", e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("wedding_guests", JSON.stringify(guests));
    }
  }, [guests, mounted]);

  // --- עדכון מהיר ישירות מהטבלה ---
  const updateGuestField = (id: string, field: keyof Guest, value: any) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGuest.name) return;

    if (editingId) {
      setGuests((prev) =>
        prev.map((g) => (g.id === editingId ? { ...g, ...formGuest } : g)),
      );
      setEditingId(null);
    } else {
      const guestToAdd: Guest = {
        id: Math.random().toString(36).substr(2, 9),
        ...formGuest,
        ageGroup: "Adult",
        status: "Pending",
      };
      setGuests((prev) => [...prev, guestToAdd]);
    }

    setFormGuest({
      name: "",
      phone: "",
      side: "Joint",
      relationship: "Other",
      expectedGuests: 1,
    });
    setIsFormOpen(false);
  };

  const startEdit = (guest: Guest) => {
    setFormGuest({
      name: guest.name,
      phone: guest.phone,
      side: guest.side,
      relationship: guest.relationship,
      expectedGuests: guest.expectedGuests,
    });
    setEditingId(guest.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen bg-wedding-beige p-8 text-wedding-brown"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto pt-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-10 border-b border-wedding-sand pb-6">
          <div>
            <h1 className="text-4xl font-serif font-bold text-wedding-dark">
              ניהול מוזמנים
            </h1>
            <p className="text-stone-500 mt-1">
              סה"כ מוזמנים:{" "}
              <span className="font-bold text-wedding-brown">
                {guests.reduce((acc, g) => acc + g.expectedGuests, 0)}
              </span>
            </p>
          </div>
          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              if (editingId) setEditingId(null);
            }}
            className="bg-wedding-dark text-wedding-beige px-8 py-3 rounded-full font-bold hover:bg-stone-800 transition-all shadow-md active:scale-95"
          >
            {isFormOpen ? "סגור טופס" : "➕ הוסף מוזמן"}
          </button>
        </div>

        {/* Form Section - חזר במלואו עם כל השדות */}
        {isFormOpen && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-[32px] border border-wedding-sand shadow-lg mb-10 animate-in fade-in slide-in-from-top-4 duration-300"
          >
            <h3 className="font-bold text-wedding-dark mb-6 text-lg">
              {editingId ? "📝 עריכת אורח" : "👤 אורח חדש"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end mb-6">
              <div className="flex flex-col gap-1 lg:col-span-2">
                <label className="text-[10px] font-black uppercase opacity-50">
                  שם מלא *
                </label>
                <input
                  type="text"
                  value={formGuest.name}
                  onChange={(e) =>
                    setFormGuest({ ...formGuest, name: e.target.value })
                  }
                  className="bg-wedding-beige/20 border border-wedding-sand p-3 rounded-xl outline-none focus:border-wedding-brown font-bold"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase opacity-50">
                  טלפון
                </label>
                <input
                  type="tel"
                  value={formGuest.phone}
                  onChange={(e) =>
                    setFormGuest({ ...formGuest, phone: e.target.value })
                  }
                  className="bg-wedding-beige/20 border border-wedding-sand p-3 rounded-xl outline-none text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase opacity-50">
                  צד
                </label>
                <select
                  value={formGuest.side}
                  onChange={(e) =>
                    setFormGuest({
                      ...formGuest,
                      side: e.target.value as Guest["side"],
                    })
                  }
                  className="bg-wedding-beige/20 border border-wedding-sand p-3 rounded-xl outline-none font-bold"
                >
                  <option value="Groom">צד חתן</option>
                  <option value="Bride">צד כלה</option>
                  <option value="Joint">משותף</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase opacity-50">
                  קשר
                </label>
                <select
                  value={formGuest.relationship}
                  onChange={(e) =>
                    setFormGuest({
                      ...formGuest,
                      relationship: e.target.value as Guest["relationship"],
                    })
                  }
                  className="bg-wedding-beige/20 border border-wedding-sand p-3 rounded-xl outline-none font-bold"
                >
                  <option value="Family">משפחה</option>
                  <option value="Friends">חברים</option>
                  <option value="Work">עבודה</option>
                  <option value="Army">צבא</option>
                  <option value="Other">אחר</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase opacity-50">
                  כמות
                </label>
                <input
                  type="number"
                  min="1"
                  value={formGuest.expectedGuests}
                  onChange={(e) =>
                    setFormGuest({
                      ...formGuest,
                      expectedGuests: parseInt(e.target.value) || 1,
                    })
                  }
                  className="bg-wedding-beige/20 border border-wedding-sand p-3 rounded-xl outline-none text-center font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-wedding-dark text-wedding-beige px-12 py-3 rounded-xl font-bold shadow-md hover:bg-stone-800 transition-all"
              >
                {editingId ? "עדכן שינויים" : "שמור מוזמן"}
              </button>
            </div>
          </form>
        )}

        <div className="mb-10">
          <ExcelImport
            onImport={(imported) => setGuests((prev) => [...prev, ...imported])}
          />
        </div>

        {/* Guests Table */}
        <div className="bg-white border border-wedding-sand rounded-[32px] shadow-sm overflow-hidden">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-wedding-sand/20 border-b border-wedding-sand text-wedding-dark font-black text-[11px] uppercase tracking-wider">
                <th className="p-5">שם האורח</th>
                <th className="p-5">טלפון</th>
                <th className="p-5 text-center">כמות</th>
                <th className="p-5">צד (בחירה מהירה)</th>
                <th className="p-5">קשר (בחירה מהירה)</th>
                <th className="p-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wedding-sand/10">
              {guests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-16 text-center text-stone-400 italic"
                  >
                    אין אורחים ברשימה
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="hover:bg-wedding-beige/10 transition-colors group"
                  >
                    <td className="p-5 font-bold text-wedding-dark">
                      {guest.name}
                    </td>
                    <td className="p-5 text-stone-500 font-mono text-sm">
                      {guest.phone}
                    </td>
                    <td className="p-5 text-center font-bold">
                      {guest.expectedGuests}
                    </td>

                    {/* בחירת צד ישירות מהטבלה */}
                    <td className="p-5">
                      <select
                        value={guest.side}
                        onChange={(e) =>
                          updateGuestField(guest.id, "side", e.target.value)
                        }
                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg border-0 cursor-pointer outline-none transition-all ${
                          guest.side === "Groom"
                            ? "bg-blue-50 text-blue-700"
                            : guest.side === "Bride"
                              ? "bg-pink-50 text-pink-700"
                              : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        <option value="Groom">צד חתן</option>
                        <option value="Bride">צד כלה</option>
                        <option value="Joint">משותף</option>
                      </select>
                    </td>

                    {/* בחירת קשר ישירות מהטבלה */}
                    <td className="p-5">
                      <select
                        value={guest.relationship}
                        onChange={(e) =>
                          updateGuestField(
                            guest.id,
                            "relationship",
                            e.target.value,
                          )
                        }
                        className="bg-wedding-beige/30 text-wedding-dark text-[10px] font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer outline-none hover:bg-wedding-sand/40 transition-all"
                      >
                        <option value="Family">משפחה</option>
                        <option value="Friends">חברים</option>
                        <option value="Work">עבודה</option>
                        <option value="Army">צבא</option>
                        <option value="Other">אחר</option>
                      </select>
                    </td>

                    <td className="p-5">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(guest)}
                          className="text-wedding-dark/40 hover:text-wedding-dark font-bold text-xs"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => deleteGuest(guest.id)}
                          className="text-red-200 hover:text-red-600 transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

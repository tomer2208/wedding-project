"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Vendor } from "@/types/vendor"; // ודא שיצרת את הקובץ הזה לפי ההסבר הקודם

const categories = [
  "אולם וגן אירועים",
  "קייטרינג ואוכל",
  "בר ואלכוהול",
  "צלם סטילס",
  "צלם וידאו",
  "דיג'יי ולהקה",
  "שמלת כלה",
  "איפור ושיער",
  "חליפת חתן",
  "טבעות תכשיטים",
  "עיצוב ואווירה",
  "אחר",
];

export default function BudgetPage() {
  const router = useRouter();
  const supabase = createClient();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // מצב הוספת ספק חדש
  const [isAdding, setIsAdding] = useState(false);
  const [newVendor, setNewVendor] = useState<Partial<Vendor>>({
    category: "אולם וגן אירועים",
    name: "",
    planned_cost: 0,
    actual_cost: 0,
    downpayment: 0,
  });

  // מצב עריכה
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Vendor>>({});

  // 1. טעינת הנתונים בעליית העמוד
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUserId(session.user.id);

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true }); // מסדר לפי סדר ההוספה

      if (error) console.error("Error fetching vendors:", error);
      else if (data) setVendors(data as Vendor[]);

      setIsLoaded(true);
    };

    checkAuthAndFetch();
  }, [router, supabase]);

  // 2. שמירת ספק חדש
  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newVendor.name) return;

    const vendorToInsert = {
      ...newVendor,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from("vendors")
      .insert([vendorToInsert])
      .select()
      .single();

    if (!error && data) {
      setVendors((prev) => [...prev, data as Vendor]);
      setIsAdding(false);
      setNewVendor({
        category: "אולם וגן אירועים",
        name: "",
        planned_cost: 0,
        actual_cost: 0,
        downpayment: 0,
      });
    } else {
      alert("שגיאה בשמירת הספק: " + error?.message);
    }
  };

  // 3. מחיקת ספק
  const handleDeleteVendor = async (id: string) => {
    if (window.confirm("האם למחוק ספק זה?")) {
      const { error } = await supabase.from("vendors").delete().eq("id", id);
      if (!error) setVendors((prev) => prev.filter((v) => v.id !== id));
    }
  };

  // 4. עריכת ספק (התחלה)
  const handleStartEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setEditFormData({ ...vendor });
  };

  // 5. שמירת עריכה
  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase
      .from("vendors")
      .update(editFormData)
      .eq("id", id);

    if (!error) {
      setVendors((prev) =>
        prev.map((v) =>
          v.id === id ? ({ ...v, ...editFormData } as Vendor) : v,
        ),
      );
      setEditingId(null);
    } else {
      alert("שגיאה בעדכון הספק");
    }
  };

  // --- חישובי סטטיסטיקות ---
  const totalPlanned = vendors.reduce(
    (sum, v) => sum + (Number(v.planned_cost) || 0),
    0,
  );
  const totalActual = vendors.reduce(
    (sum, v) => sum + (Number(v.actual_cost) || 0),
    0,
  );
  const totalPaid = vendors.reduce(
    (sum, v) => sum + (Number(v.downpayment) || 0),
    0,
  );
  const remainingToPay = totalActual - totalPaid; // כמה נשאר לשלם בפועל

  if (!isLoaded) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 pt-24 space-y-10" dir="rtl">
      {/* כותרת וסיכום כלכלי */}
      <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200 shadow-sm relative overflow-hidden">
        <h1 className="text-3xl font-bold text-wedding-dark mb-6">
          ניהול תקציב וספקים (מחובר לענן ☁️)
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 relative z-10">
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm text-center">
            <span className="text-sm font-bold text-stone-500 block mb-1">
              תכנון מקורי
            </span>
            <span className="text-2xl md:text-3xl font-black text-stone-400">
              ₪{totalPlanned.toLocaleString()}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm text-center">
            <span className="text-sm font-bold text-stone-500 block mb-1">
              עלות בפועל
            </span>
            <span className="text-2xl md:text-3xl font-black text-wedding-dark">
              ₪{totalActual.toLocaleString()}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm text-center">
            <span className="text-sm font-bold text-stone-500 block mb-1">
              שולם (מקדמות)
            </span>
            <span className="text-2xl md:text-3xl font-black text-green-600">
              ₪{totalPaid.toLocaleString()}
            </span>
          </div>
          <div className="bg-wedding-dark p-4 rounded-2xl shadow-md text-center">
            <span className="text-sm font-bold text-wedding-beige/70 block mb-1">
              נותר לשלם
            </span>
            <span className="text-2xl md:text-3xl font-black text-wedding-sand">
              ₪{remainingToPay.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <section className="border-t border-stone-200 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-wedding-dark">
            רשימת הספקים ({vendors.length})
          </h2>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-5 py-2.5 bg-wedding-dark text-wedding-beige font-bold rounded-xl hover:bg-stone-700 transition-all flex items-center gap-2"
          >
            {isAdding ? "✕ סגור טופס" : "➕ הוסף ספק חדש"}
          </button>
        </div>

        {/* טופס הוספת ספק */}
        {isAdding && (
          <form
            onSubmit={handleAddVendor}
            className="bg-stone-50 p-6 rounded-2xl border border-stone-200 mb-8 animate-in fade-in slide-in-from-top-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  קטגוריה
                </label>
                <select
                  value={newVendor.category}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, category: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-300 outline-none focus:border-wedding-brown bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  שם הספק *
                </label>
                <input
                  required
                  type="text"
                  placeholder="למשל: חיים הצלם"
                  value={newVendor.name}
                  onChange={(e) =>
                    setNewVendor({ ...newVendor, name: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-300 outline-none focus:border-wedding-brown"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  הערכה (₪)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newVendor.planned_cost || ""}
                  onChange={(e) =>
                    setNewVendor({
                      ...newVendor,
                      planned_cost: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-300 outline-none focus:border-wedding-brown"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-wedding-brown text-white font-bold rounded-xl hover:bg-stone-600 transition-all"
                >
                  💾 שמור
                </button>
              </div>
            </div>
          </form>
        )}

        {/* טבלת ספקים */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium text-sm">
                <tr>
                  <th className="p-4 w-1/4">קטגוריה וספק</th>
                  <th className="p-4">תכנון מקורי</th>
                  <th className="p-4">סגירה בפועל</th>
                  <th className="p-4">שולם (מקדמה)</th>
                  <th className="p-4">נותר לתשלום</th>
                  <th className="p-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-stone-400">
                      אין ספקים ברשימה. לחצו על "הוסף ספק חדש" כדי להתחיל.
                    </td>
                  </tr>
                ) : (
                  vendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className={`transition-colors ${editingId === vendor.id ? "bg-wedding-sand/10" : "hover:bg-stone-50/50"}`}
                    >
                      {editingId === vendor.id ? (
                        /* מצב עריכה */
                        <>
                          <td className="p-3 space-y-2">
                            <select
                              value={editFormData.category}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  category: e.target.value,
                                })
                              }
                              className="w-full p-1 border rounded text-sm bg-white"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={editFormData.name}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  name: e.target.value,
                                })
                              }
                              className="w-full p-1 border rounded text-sm font-bold"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={editFormData.planned_cost}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  planned_cost: Number(e.target.value),
                                })
                              }
                              className="w-full p-1 border rounded text-sm"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={editFormData.actual_cost}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  actual_cost: Number(e.target.value),
                                })
                              }
                              className="w-full p-1 border rounded text-sm bg-green-50 focus:bg-white"
                            />
                          </td>
                          <td className="p-3" colSpan={2}>
                            <input
                              type="number"
                              value={editFormData.downpayment}
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  downpayment: Number(e.target.value),
                                })
                              }
                              className="w-full p-1 border rounded text-sm"
                              placeholder="כמה שולם?"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleSaveEdit(vendor.id)}
                                className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded shadow-sm"
                              >
                                שמור
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 bg-stone-300 text-stone-700 text-xs font-bold rounded shadow-sm"
                              >
                                בטל
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        /* מצב תצוגה */
                        <>
                          <td className="p-4">
                            <div className="text-xs text-stone-400 font-bold mb-0.5">
                              {vendor.category}
                            </div>
                            <div className="font-bold text-stone-800">
                              {vendor.name}
                            </div>
                          </td>
                          <td className="p-4 text-stone-500">
                            ₪{vendor.planned_cost?.toLocaleString() || 0}
                          </td>
                          <td className="p-4 font-bold text-wedding-dark">
                            ₪{vendor.actual_cost?.toLocaleString() || 0}
                          </td>
                          <td className="p-4 text-green-600 font-bold">
                            ₪{vendor.downpayment?.toLocaleString() || 0}
                          </td>
                          <td className="p-4 text-red-500 font-bold">
                            ₪
                            {(
                              (vendor.actual_cost || 0) -
                              (vendor.downpayment || 0)
                            ).toLocaleString()}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center gap-4">
                              <button
                                onClick={() => handleStartEdit(vendor)}
                                className="text-stone-400 hover:text-wedding-brown transition-colors"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteVendor(vendor.id)}
                                className="text-stone-400 hover:text-red-500 transition-colors"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

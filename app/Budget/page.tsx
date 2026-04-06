"use client";

import { useState, useEffect, useMemo } from "react";

// טיפוס נתונים מורחב עבור שורת תקציב וספק
interface BudgetItem {
  id: string;
  category: string;
  vendorName: string;
  contactName: string;
  phone: string;
  planned: number;
  actual: number;
  downpayment: number;
}

export default function BudgetPage() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [newItem, setNewItem] = useState({
    category: "",
    vendorName: "",
    contactName: "",
    phone: "",
    planned: 0,
    actual: 0,
    downpayment: 0,
  });

  // טעינה מהזיכרון
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("wedding_budget");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // שמירה לזיכרון בכל שינוי
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("wedding_budget", JSON.stringify(items));
    }
  }, [items, mounted]);

  // --- חישובים לוגיים ---
  const totals = useMemo(() => {
    const planned = items.reduce((acc, item) => acc + item.planned, 0);
    const actual = items.reduce((acc, item) => acc + item.actual, 0);
    const paid = items.reduce((acc, item) => acc + (item.downpayment || 0), 0);

    return {
      planned,
      actual,
      paid,
      remainingToPay: actual - paid, // יתרה לתשלום לספקים
      saved: planned - actual, // חיסכון מול התכנון
    };
  }, [items]);

  // --- Handlers ---
  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.category) return;

    const item: BudgetItem = {
      id: Math.random().toString(36).substr(2, 9),
      category: newItem.category,
      vendorName: newItem.vendorName,
      contactName: newItem.contactName,
      phone: newItem.phone,
      planned: newItem.planned,
      actual: newItem.actual || 0,
      downpayment: newItem.downpayment || 0,
    };

    setItems([...items, item]);
    setNewItem({
      category: "",
      vendorName: "",
      contactName: "",
      phone: "",
      planned: 0,
      actual: 0,
      downpayment: 0,
    });
    setIsFormOpen(false);
  };

  // פונקציה גנרית לעדכון שדות בטבלה (כמו מחיר סופי ומקדמה)
  const updateField = (id: string, field: keyof BudgetItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  if (!mounted) return null; // מניעת שגיאת Hydration

  return (
    <div
      className="min-h-screen bg-wedding-beige p-8 text-wedding-brown"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto pt-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-wedding-sand pb-6 gap-6">
          <div>
            <h1 className="text-4xl font-serif font-bold text-wedding-dark">
              ניהול תקציב וספקים
            </h1>
            <p className="text-stone-500 mt-2">
              מתכננים חכם, עוקבים אחרי תשלומים
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-wedding-dark border-2 border-wedding-dark text-wedding-beige px-8 py-3 rounded-full font-bold hover:bg-stone-800 hover:border-stone-800 hover:text-white transition-all shadow-sm active:scale-95 whitespace-nowrap"
          >
            {isFormOpen ? "ביטול הוספה" : "➕ הוסף התחייבות/ספק"}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-wedding-sand shadow-sm">
            <p className="text-xs text-stone-500 font-black uppercase mb-1">
              תקציב מתוכנן
            </p>
            <p className="text-2xl font-bold text-wedding-dark">
              ₪{totals.planned.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-wedding-sand shadow-sm">
            <p className="text-xs text-stone-500 font-black uppercase mb-1">
              סה"כ חוזים (בפועל)
            </p>
            <p className="text-2xl font-bold text-wedding-brown">
              ₪{totals.actual.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50/80 backdrop-blur-sm p-6 rounded-3xl border border-green-200 shadow-sm">
            <p className="text-xs text-green-700 font-black uppercase mb-1">
              שולם מקדמות
            </p>
            <p className="text-2xl font-bold text-green-700">
              ₪{totals.paid.toLocaleString()}
            </p>
          </div>
          <div className="bg-wedding-dark p-6 rounded-3xl shadow-sm text-wedding-beige">
            <p className="text-xs font-black uppercase mb-1 opacity-80">
              נותר לשלם לספקים
            </p>
            <p className="text-2xl font-black">
              ₪{totals.remainingToPay.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Add Form */}
        {isFormOpen && (
          <form
            onSubmit={addItem}
            className="bg-white p-8 rounded-3xl border border-wedding-sand shadow-sm mb-10 animate-in fade-in slide-in-from-top-4 duration-300"
          >
            <h3 className="font-bold text-lg mb-6 border-b border-wedding-sand/40 pb-2">
              פרטי ספק והוצאה
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase opacity-60">
                  קטגוריה *
                </label>
                <input
                  type="text"
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({ ...newItem, category: e.target.value })
                  }
                  className="bg-wedding-beige/30 border border-wedding-sand p-3 rounded-xl outline-none focus:border-wedding-brown"
                  placeholder="למשל: צלם, אולם..."
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase opacity-60">
                  תקציב מתוכנן
                </label>
                <input
                  type="number"
                  value={newItem.planned || ""}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      planned: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-wedding-beige/30 border border-wedding-sand p-3 rounded-xl outline-none focus:border-wedding-brown font-bold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase opacity-60">
                  שם הספק / עסק
                </label>
                <input
                  type="text"
                  value={newItem.vendorName}
                  onChange={(e) =>
                    setNewItem({ ...newItem, vendorName: e.target.value })
                  }
                  className="bg-wedding-beige/30 border border-wedding-sand p-3 rounded-xl outline-none focus:border-wedding-brown"
                  placeholder="הכנס שם ספק"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase opacity-60">
                  איש קשר
                </label>
                <input
                  type="text"
                  value={newItem.contactName}
                  onChange={(e) =>
                    setNewItem({ ...newItem, contactName: e.target.value })
                  }
                  className="bg-wedding-beige/30 border border-wedding-sand p-3 rounded-xl outline-none focus:border-wedding-brown"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase opacity-60">
                  טלפון
                </label>
                <input
                  type="tel"
                  value={newItem.phone}
                  onChange={(e) =>
                    setNewItem({ ...newItem, phone: e.target.value })
                  }
                  className="bg-wedding-beige/30 border border-wedding-sand p-3 rounded-xl outline-none focus:border-wedding-brown text-left"
                  dir="ltr"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase opacity-60">
                  סה"כ נסגר בחוזה (בפועל)
                </label>
                <input
                  type="number"
                  value={newItem.actual || ""}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      actual: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-wedding-beige/30 border border-wedding-sand p-3 rounded-xl outline-none focus:border-wedding-brown font-bold"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase text-green-700">
                  מקדמה ששולמה
                </label>
                <input
                  type="number"
                  value={newItem.downpayment || ""}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      downpayment: parseInt(e.target.value) || 0,
                    })
                  }
                  className="bg-green-50 border border-green-200 p-3 rounded-xl outline-none text-green-700 font-bold"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="bg-wedding-dark text-wedding-beige px-12 py-3 rounded-full font-bold hover:bg-stone-800 transition-all text-lg shadow-md active:scale-95"
              >
                שמור התחייבות
              </button>
            </div>
          </form>
        )}

        {/* Expenses & Vendors Table */}
        <div className="bg-white border border-wedding-sand rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-wedding-sand/20 border-b border-wedding-sand text-wedding-dark font-black text-xs uppercase tracking-wide">
                  <th className="p-5 w-48">קטגוריה</th>
                  <th className="p-5 w-56">פרטי ספק</th>
                  <th className="p-5 text-center">מתוכנן</th>
                  <th className="p-5 text-center bg-wedding-sand/5">
                    סה"כ בחוזה
                  </th>
                  <th className="p-5 text-center text-green-700">מקדמה</th>
                  <th className="p-5 text-center text-red-600">יתרה לתשלום</th>
                  <th className="p-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-wedding-sand/20">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-wedding-beige/10 transition-colors"
                  >
                    <td className="p-5">
                      <span className="bg-wedding-beige/50 text-wedding-dark text-xs px-3 py-1.5 rounded-lg font-bold">
                        {item.category}
                      </span>
                    </td>

                    <td className="p-5">
                      <p className="font-bold text-wedding-dark text-sm">
                        {item.vendorName || "טרם נבחר ספק"}
                      </p>
                      <div className="flex flex-col gap-0.5 mt-1 text-xs text-stone-500">
                        {item.contactName && <span>👤 {item.contactName}</span>}
                        {item.phone && (
                          <a
                            href={`tel:${item.phone}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-mono"
                            dir="ltr"
                          >
                            📞 {item.phone}
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="p-5 text-center font-medium text-stone-500">
                      ₪{item.planned.toLocaleString()}
                    </td>

                    {/* עריכת מחיר סופי */}
                    <td className="p-5 bg-wedding-sand/5 border-x border-wedding-sand/10">
                      <div className="flex justify-center items-center gap-1">
                        <span className="text-xs text-stone-400">₪</span>
                        <input
                          type="number"
                          value={item.actual || ""}
                          placeholder="0"
                          onChange={(e) =>
                            updateField(
                              item.id,
                              "actual",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-24 bg-white border border-wedding-sand p-2 rounded-lg text-center font-bold focus:border-wedding-brown outline-none"
                        />
                      </div>
                    </td>

                    {/* עריכת מקדמה */}
                    <td className="p-5">
                      <div className="flex justify-center items-center gap-1">
                        <span className="text-xs text-stone-400">₪</span>
                        <input
                          type="number"
                          value={item.downpayment || ""}
                          placeholder="0"
                          onChange={(e) =>
                            updateField(
                              item.id,
                              "downpayment",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-24 bg-green-50 border border-green-200 text-green-700 p-2 rounded-lg text-center font-bold focus:border-green-400 outline-none"
                        />
                      </div>
                    </td>

                    <td className="p-5 text-center font-black text-wedding-dark text-lg">
                      ₪
                      {(
                        (item.actual || 0) - (item.downpayment || 0)
                      ).toLocaleString()}
                    </td>

                    <td className="p-5 text-left">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-stone-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-16 text-center text-stone-400 italic text-lg"
                    >
                      עדיין לא הזנתם הוצאות. לחצו על "הוסף התחייבות" כדי להתחיל!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

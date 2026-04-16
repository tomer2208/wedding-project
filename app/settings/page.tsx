"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [coupleNames, setCoupleNames] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [slug, setSlug] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // טעינת נתונים קיימים (אם יש) כשהעמוד עולה
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUserId(session.user.id);

      // מנסה למשוך את הפרופיל הקיים של היוזר
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setCoupleNames(data.couple_names || "");
        setWeddingDate(data.wedding_date || "");
        setSlug(data.slug || "");
      }
    };

    fetchProfile();
  }, [router, supabase]);

  // פונקציית שמירת הפרופיל
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setMessage({ text: "", type: "" });

    // ולידציה של הלינק - רק אותיות באנגלית (קטנות), מספרים ומקפים
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      setMessage({
        text: "הלינק יכול להכיל רק אותיות קטנות באנגלית, מספרים ומקפים (-), ללא רווחים.",
        type: "error",
      });
      return;
    }

    setIsLoading(true);

    // ביצוע Upsert (עדכון אם קיים, הכנסה אם חדש)
    const { error } = await supabase.from("profiles").upsert({
      id: userId, // חובה לשלוח את ה-ID כדי שזה יישמר על היוזר הנכון
      couple_names: coupleNames,
      wedding_date: weddingDate,
      slug: slug,
    });

    if (error) {
      // אם הלינק כבר תפוס על ידי זוג אחר, Supabase יזרוק שגיאה כי הגדרנו אותו כ-UNIQUE ב-SQL
      if (error.code === "23505") {
        setMessage({
          text: "הלינק הזה כבר תפוס על ידי זוג אחר 😢 נסו משהו אחר.",
          type: "error",
        });
      } else {
        setMessage({ text: "שגיאה בשמירה: " + error.message, type: "error" });
      }
    } else {
      setMessage({ text: "ההגדרות נשמרו בהצלחה! 🎉", type: "success" });
      // אפשר להחליט להעביר אותם חזרה לדאשבורד או להשאיר כאן
      setTimeout(() => router.push("/"), 1000); // מעביר לדאשבורד אחרי שנייה
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 pt-24 space-y-10" dir="rtl">
      <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200 shadow-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-wedding-dark">
            הגדרות האירוע
          </h1>
          <p className="text-stone-500 mt-2">
            כאן תגדירו את פרטי החתונה שלכם ואיך יראה הלינק שתשלחו לאורחים.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">
              שמות בני הזוג (יופיע לאורחים)
            </label>
            <input
              required
              type="text"
              value={coupleNames}
              onChange={(e) => setCoupleNames(e.target.value)}
              placeholder="למשל: סיוון ותומר"
              className="w-full border-stone-300 rounded-xl p-3 border outline-none focus:border-wedding-brown focus:ring-1 focus:ring-wedding-brown"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">
              תאריך החתונה
            </label>
            <input
              required
              type="date"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
              className="w-full border-stone-300 rounded-xl p-3 border outline-none focus:border-wedding-brown focus:ring-1 focus:ring-wedding-brown"
            />
          </div>

          <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-inner">
            <label className="block text-sm font-bold text-wedding-dark mb-2">
              הלינק האישי שלכם (RSVP) 🔗
            </label>
            <p className="text-xs text-stone-500 mb-4">
              הקישור לאישור הגעה שיישלח לאורחים. השתמשו רק באנגלית ומקפים.
            </p>

            <div
              className="flex flex-col md:flex-row items-center gap-2"
              dir="ltr"
            >
              <span className="text-stone-400 font-mono text-sm hidden md:inline">
                wedding-app.vercel.app/rsvp/
              </span>
              <input
                required
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="sivan-and-tomer"
                className="flex-1 w-full border-stone-300 rounded-xl p-3 border outline-none font-mono text-wedding-brown focus:border-wedding-brown focus:ring-1 focus:ring-wedding-brown bg-stone-50"
              />
            </div>
          </div>

          {message.text && (
            <div
              className={`p-4 rounded-xl text-sm font-bold ${message.type === "error" ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-wedding-dark text-wedding-beige font-bold rounded-xl hover:bg-stone-700 transition-all shadow-md text-lg disabled:opacity-70"
          >
            {isLoading ? "שומר נתונים..." : "שמור הגדרות"}
          </button>
        </form>
      </div>
    </div>
  );
}

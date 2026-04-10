"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const router = useRouter();
  const supabase = createClient();

  // פונקציית הרשמה (זוג חדש)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage({ text: "אופס, משהו השתבש: " + error.message, type: "error" });
    } else {
      setMessage({ text: "הרשמה בוצעה בהצלחה! אפשר להתחבר.", type: "success" });
    }
    setLoading(false);
  };

  // פונקציית התחברות (זוג קיים)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ text: "אימייל או סיסמה שגויים", type: "error" });
    } else {
      // התחברות מוצלחת! נעביר אותם לעמוד הניהול
      router.push("/guests");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-stone-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-200 max-w-sm w-full animate-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💍</div>
          <h1 className="text-3xl font-bold text-wedding-dark">החתונה שלנו</h1>
          <p className="text-stone-500 text-sm mt-2">
            התחברו כדי לנהל את האירוע שלכם
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">
              אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-left p-3 border border-stone-300 rounded-xl focus:border-wedding-brown outline-none"
              placeholder="זוג@gmail.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">
              סיסמה
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-left p-3 border border-stone-300 rounded-xl focus:border-wedding-brown outline-none"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          {message.text && (
            <div
              className={`p-3 rounded-lg text-sm font-bold ${message.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
            >
              {message.text}
            </div>
          )}

          <div className="pt-4 space-y-3">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 bg-wedding-dark text-wedding-beige font-bold rounded-xl hover:bg-stone-700 transition-all"
            >
              {loading ? "טוען..." : "כניסה למערכת"}
            </button>

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full py-3 bg-white border-2 border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-50 transition-all"
            >
              זוג חדש? הרשמה חינם
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

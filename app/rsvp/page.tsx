"use client";

import React, { useState, useEffect } from "react";
import { Guest } from "@/types/guest";
import { createClient } from "@/utils/supabase/client"; // הצינור החדש שלנו
import {
  findGuestByPhoneOnServer,
  updateRsvpOnServer,
} from "@/app/actions/rsvp";

export default function RsvpPage() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [foundGuest, setFoundGuest] = useState<Guest | null>(null);
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [actualGuests, setActualGuests] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // --- חיפוש אורח (קריאה לשרת) ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");

    if (!searchQuery) {
      setSearchError("אנא הזינו מספר טלפון תקין.");
      return;
    }

    const response = await findGuestByPhoneOnServer(searchQuery);

    if (!response.success || !response.guest) {
      setSearchError(
        "לא מצאנו אורח עם מספר הטלפון הזה. ודאו שהזנתם את המספר שנרשם בהזמנה.",
      );
    } else {
      setFoundGuest(response.guest);
      setActualGuests(response.guest.expectedGuests || 1);
      setStep(2);
    }
  };

  // --- עדכון התשובה (קריאה לשרת) ---
  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAttending === null || !foundGuest) return;

    setIsSubmitting(true);

    const response = await updateRsvpOnServer(
      foundGuest.id,
      isAttending,
      actualGuests,
    );

    if (response.success) {
      setStep(3);
    } else {
      alert("הייתה תקלה בעדכון. אנא נסו שוב מאוחר יותר.");
    }
    setIsSubmitting(false);
  };

  return (
    <div
      className="min-h-screen bg-stone-50 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-wedding-sand relative">
        <div className="absolute top-0 left-0 right-0 h-32 bg-wedding-beige/40 rounded-b-[100%] border-b border-wedding-sand/30"></div>

        <div className="p-8 pt-12 relative z-10 text-center">
          <h1 className="text-4xl font-serif font-bold text-wedding-dark mb-2">
            סיוון ותומר
          </h1>
          <p className="text-stone-500 font-medium tracking-widest uppercase text-sm mb-8">
            2 ביוני 2026
          </p>

          {step === 1 && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <h2 className="text-xl font-bold text-wedding-brown mb-4">
                אישור הגעה דיגיטלי
              </h2>
              <p className="text-stone-600 mb-6 text-sm">
                הזינו טלפון כדי לאשר הגעה:
              </p>
              <form onSubmit={handleSearch} className="space-y-4">
                <input
                  type="tel"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="05X-XXXXXXX"
                  className="w-full text-center p-4 border border-stone-200 rounded-xl focus:border-wedding-brown outline-none bg-stone-50 text-lg tracking-widest"
                />
                {searchError && (
                  <p className="text-red-500 text-xs font-bold">
                    {searchError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-4 bg-wedding-dark text-wedding-beige font-bold rounded-xl hover:bg-stone-700 transition-all shadow-md"
                >
                  המשך לאישור 🤍
                </button>
              </form>
            </div>
          )}

          {step === 2 && foundGuest && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-500">
              <h2 className="text-2xl font-bold text-wedding-dark mb-2">
                היי {foundGuest.name}! 👋
              </h2>
              <form
                onSubmit={handleSubmitRsvp}
                className="space-y-6 text-right"
              >
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAttending(true)}
                    className={`py-4 rounded-xl border-2 font-bold transition-all ${isAttending === true ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-stone-200 text-stone-500"}`}
                  >
                    ✅ מגיעים
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAttending(false)}
                    className={`py-4 rounded-xl border-2 font-bold transition-all ${isAttending === false ? "bg-red-50 border-red-500 text-red-700" : "bg-white border-stone-200 text-stone-500"}`}
                  >
                    ❌ לא נגיע
                  </button>
                </div>

                {isAttending === true && (
                  <div className="bg-wedding-beige/30 p-5 rounded-xl border border-wedding-sand text-center">
                    <label className="block text-sm font-bold text-stone-700 mb-3">
                      כמה אנשים תגיעו?
                    </label>
                    <div className="flex items-center justify-center gap-6">
                      <button
                        type="button"
                        onClick={() =>
                          setActualGuests(Math.max(1, actualGuests - 1))
                        }
                        className="w-10 h-10 rounded-full bg-white border border-stone-300 font-black"
                      >
                        -
                      </button>
                      <span className="text-3xl font-black text-wedding-dark w-8">
                        {actualGuests}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActualGuests(actualGuests + 1)}
                        className="w-10 h-10 rounded-full bg-white border border-stone-300 font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {isAttending !== null && (
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full py-4 bg-wedding-brown text-white font-bold rounded-xl hover:bg-stone-600 shadow-md transition-all"
                  >
                    {isSubmitting ? "מעדכן..." : "שלח אישור"}
                  </button>
                )}
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in zoom-in duration-500 py-8">
              <div className="text-6xl mb-4">{isAttending ? "🥂" : "🤍"}</div>
              <h2 className="text-2xl font-bold text-wedding-dark mb-2">
                {isAttending ? "נתראה בחתונה!" : "תודה שעדכנתם"}
              </h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  getProfileBySlug,
  findGuestByPhoneOnServer,
  updateRsvpOnServer,
} from "@/app/actions/rsvp";
import { Guest } from "@/types/guest";

export default function DynamicRsvpPage() {
  const params = useParams();
  const slug = params.slug as string; // קורא את הלינק משורת הכתובת

  // סטייטים לפרופיל הזוג
  const [profile, setProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // סטייטים רגילים של RSVP
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [foundGuest, setFoundGuest] = useState<Guest | null>(null);
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [actualGuests, setActualGuests] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // טעינת פרטי החתונה ברגע שהעמוד עולה
  useEffect(() => {
    const loadProfile = async () => {
      if (slug) {
        const data = await getProfileBySlug(slug);
        setProfile(data);
      }
      setIsProfileLoading(false);
    };
    loadProfile();
  }, [slug]);

  // מסך טעינה ראשוני
  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-wedding-brown">
        טוען נתוני אירוע...
      </div>
    );
  }

  // אם הלינק לא תקין או שהזוג לא קיים
  if (!profile) {
    return (
      <div
        className="min-h-screen bg-stone-50 flex items-center justify-center p-4 text-center"
        dir="rtl"
      >
        <div>
          <div className="text-6xl mb-4">💔</div>
          <h1 className="text-2xl font-bold text-wedding-dark">
            האירוע לא נמצא
          </h1>
          <p className="text-stone-500 mt-2">
            הקישור שבור או שהאירוע הוסר מהמערכת.
          </p>
        </div>
      </div>
    );
  }

  // --- הפונקציות שלנו (מעודכנות עם profile.id) ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");

    if (!searchQuery) {
      setSearchError("אנא הזינו מספר טלפון תקין.");
      return;
    }

    // מעבירים לשרת גם את הטלפון וגם את ה-ID של הזוג כדי שיחפש רק אצלם!
    const response = await findGuestByPhoneOnServer(searchQuery, profile.id);

    if (!response.success || !response.guest) {
      setSearchError("לא מצאנו אורח עם מספר הטלפון הזה ברשימה.");
    } else {
      setFoundGuest(response.guest);
      setActualGuests(response.guest.expectedGuests || 1);
      setStep(2);
    }
  };

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
      alert("הייתה תקלה בעדכון. אנא נסו שוב.");
    }
    setIsSubmitting(false);
  };

  return (
    <div
      className="min-h-screen bg-stone-50 flex flex-col items-center p-4 font-sans"
      dir="rtl"
    >
      {/* כותרת דינמית - מושכת את השמות ממסד הנתונים! */}
      <div className="text-center mt-12 mb-8 animate-in fade-in slide-in-from-top-8 duration-700">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-wedding-dark mb-2">
          {profile.couple_names}
        </h1>
        <p className="text-lg text-wedding-brown tracking-widest uppercase">
          מתחתנים
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden relative">
        <div className="h-2 bg-wedding-brown w-full"></div>
        <div className="p-8">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-stone-800 mb-2">
                  אישור הגעה
                </h2>
                <p className="text-stone-500">
                  הזינו את מספר הטלפון שלכם כדי לחפש את ההזמנה
                </p>
              </div>
              <form onSubmit={handleSearch} className="space-y-4">
                <input
                  type="tel"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="05X-XXXXXXX"
                  className="w-full text-center tracking-widest text-lg border-stone-300 rounded-xl p-4 border-2 outline-none focus:border-wedding-brown focus:ring-0 transition-colors"
                  dir="ltr"
                />
                {searchError && (
                  <p className="text-red-500 text-sm font-bold text-center">
                    {searchError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-4 bg-wedding-dark text-wedding-beige font-bold rounded-xl hover:bg-stone-700 transition-all shadow-md text-lg"
                >
                  חיפוש הזמנה 🔍
                </button>
              </form>
            </div>
          )}

          {step === 2 && foundGuest && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {/* המשך קוד שלב 2 מהעמוד המקורי שלך (הכפתורים של בא/לא בא ובחירת כמות) */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-stone-800 mb-2">
                  היי {foundGuest.name}! ✨
                </h2>
                <p className="text-stone-500">
                  הזמנו עבורכם {foundGuest.expectedGuests} מקומות
                </p>
              </div>

              <form onSubmit={handleSubmitRsvp} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAttending(true)}
                    className={`py-4 rounded-xl font-bold border-2 transition-all ${isAttending === true ? "bg-wedding-brown border-wedding-brown text-white shadow-md" : "bg-white border-stone-200 text-stone-600 hover:border-wedding-brown/50"}`}
                  >
                    בטח שנגיע! 🥂
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAttending(false)}
                    className={`py-4 rounded-xl font-bold border-2 transition-all ${isAttending === false ? "bg-red-50 border-red-500 text-red-600 shadow-md" : "bg-white border-stone-200 text-stone-600 hover:border-red-300"}`}
                  >
                    לא נצליח 😔
                  </button>
                </div>

                {isAttending && (
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 animate-in zoom-in-95 duration-300">
                    <label className="block text-sm font-bold text-stone-700 mb-2 text-center">
                      באיזה הרכב תגיעו?
                    </label>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setActualGuests(Math.max(1, actualGuests - 1))
                        }
                        className="w-10 h-10 rounded-full bg-white border border-stone-300 text-stone-600 font-bold hover:bg-stone-100"
                      >
                        -
                      </button>
                      <span className="text-2xl font-black text-wedding-dark w-8 text-center">
                        {actualGuests}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setActualGuests(Math.min(10, actualGuests + 1))
                        }
                        className="w-10 h-10 rounded-full bg-white border border-stone-300 text-stone-600 font-bold hover:bg-stone-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isAttending === null}
                  className="w-full py-4 bg-wedding-dark text-wedding-beige font-bold rounded-xl hover:bg-stone-700 transition-all shadow-md text-lg disabled:opacity-50"
                >
                  {isSubmitting ? "מעדכן..." : "שליחת תשובה סופית"}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
              <div className="text-6xl mb-6">{isAttending ? "🎉" : "🤍"}</div>
              <h2 className="text-3xl font-bold text-wedding-dark mb-2">
                {isAttending ? "איזה כיף!" : "תודה שעדכנתם"}
              </h2>
              <p className="text-stone-500 text-lg">
                {isAttending
                  ? `התשובה נקלטה בהצלחה. נתראה ב-${new Date(profile.wedding_date).toLocaleDateString("he-IL")}!`
                  : "התשובה נקלטה בהצלחה. נשמח לחגוג יחד בשמחות אחרות!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export const useHeartbeat = () => {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkAndStartHeartbeat = async () => {
      // מוודאים שיש משתמש מחובר (כדי לא להפעיל את זה על אורחים)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // 1. שולפים מתי ראינו אותו לאחרונה
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_seen")
        .eq("id", session.user.id)
        .single();

      if (profile?.last_seen) {
        // חישוב ההפרש בדקות
        const lastSeenTime = new Date(profile.last_seen).getTime();
        const currentTime = new Date().getTime();
        const diffInMinutes = (currentTime - lastSeenTime) / 1000 / 60;

        // 2. אם עברו יותר מ-3 דקות מהרגע שהוא סגר את החלון - מנתקים!
        if (diffInMinutes > 1) {
          await supabase.auth.signOut();
          router.push("/login"); // אפשר גם להעביר פרמטר: /login?reason=timeout
          return; // עוצרים פה כדי לא להתחיל את ה"דופק"
        }
      }

      // 3. הפונקציה שמעדכנת את הזמן הנוכחי
      const updateLastSeen = async () => {
        await supabase
          .from("profiles")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", session.user.id);
      };

      // מפעילים פעם אחת מיד עם פתיחת האתר
      updateLastSeen();

      // ואז מגדירים שזה ירוץ ברקע כל 60 שניות (60000 מילישניות)
      const interval = setInterval(updateLastSeen, 60000);

      // ניקוי האינטרוול כשהקומפוננטה יורדת (Clean up)
      return () => clearInterval(interval);
    };

    checkAndStartHeartbeat();
  }, [supabase, router]);
};

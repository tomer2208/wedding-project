"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export const useHeartbeat = () => {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkAndStartHeartbeat = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        console.log("Heartbeat: אין משתמש מחובר, עוצר.");
        return;
      }

      console.log("Heartbeat: משתמש זוהה, בודק זמנים...");

      // 1. שולפים מתי ראינו אותו לאחרונה
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("last_seen")
        .eq("id", session.user.id)
        .single();

      if (fetchError) {
        console.error("Heartbeat Fetch Error (שגיאה בשליפה):", fetchError);
      }

      if (profile?.last_seen) {
        const lastSeenTime = new Date(profile.last_seen).getTime();
        const currentTime = new Date().getTime();
        const diffInMinutes = (currentTime - lastSeenTime) / 1000 / 60;

        console.log(
          `Heartbeat: עברו ${diffInMinutes.toFixed(2)} דקות מהעדכון האחרון.`,
        );

        // בדיקת ניתוק (מוגדר ל-1 דקה כרגע לצורך בדיקה)
        if (diffInMinutes > 1) {
          console.log("Heartbeat: מנתק את המשתמש!");
          await supabase.auth.signOut();
          router.push("/login");
          return;
        }
      }

      // 2. הפונקציה שמעדכנת את הזמן הנוכחי
      const updateLastSeen = async () => {
        const now = new Date().toISOString();
        console.log("Heartbeat: מנסה לעדכן את הזמן ל-", now);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ last_seen: now })
          .eq("id", session.user.id);

        if (updateError) {
          console.error(
            "Heartbeat Update Error (כנראה בעיית הרשאות RLS!):",
            updateError.message,
          );
        } else {
          console.log("Heartbeat: הזמן עודכן בהצלחה בסופבייס! ✅");
        }
      };

      // מפעילים פעם אחת מיד
      updateLastSeen();

      // ואז כל דקה
      const interval = setInterval(updateLastSeen, 60000);

      return () => clearInterval(interval);
    };

    checkAndStartHeartbeat();
  }, [supabase, router]);
};

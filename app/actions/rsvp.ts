"use server"; // מילת הקסם - הקוד הזה רץ רק בשרת, בטוח לחלוטין

import { createClient } from "@supabase/supabase-js";
import { Guest } from "@/types/guest";

// יצירת חיבור "אדמין" שעוקף את ה-RLS באמצעות המפתח הסודי
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // המפתח החדש שלנו
);

// פונקציה למציאת אורח לפי טלפון
export async function findGuestByPhoneOnServer(phoneQuery: string) {
  const cleanPhone = phoneQuery.replace(/\D/g, "");

  const { data, error } = await supabaseAdmin
    .from("guests")
    .select("*")
    .ilike("phone", `%${cleanPhone}%`)
    .single();

  if (error || !data) {
    return { success: false, guest: null };
  }

  return { success: true, guest: data as Guest };
}

// פונקציה לעדכון תשובת האורח
export async function updateRsvpOnServer(
  guestId: string,
  isAttending: boolean,
  actualGuests: number,
) {
  const { error } = await supabaseAdmin
    .from("guests")
    .update({
      status: isAttending ? "Confirmed" : "Declined",
      expectedGuests: isAttending ? actualGuests : 0,
    })
    .eq("id", guestId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

"use server";

import { createClient } from "@supabase/supabase-js";
import { Guest } from "@/types/guest";

// חיבור מנהל שעוקף את ה-RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// 1. פונקציה חדשה: מציאת הפרופיל לפי הלינק (slug)
export async function getProfileBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data;
}

// 2. פונקציה מעודכנת: חיפוש אורח לפי טלפון *וגם* לפי ה-ID של הזוג
export async function findGuestByPhoneOnServer(
  phoneQuery: string,
  userId: string,
) {
  const cleanPhone = phoneQuery.replace(/\D/g, "");

  const { data, error } = await supabaseAdmin
    .from("guests")
    .select("*")
    .eq("user_id", userId) // חובה! מוודא שמחפשים רק ברשימה של הזוג הספציפי
    .ilike("phone", `%${cleanPhone}%`)
    .single();

  if (error || !data) {
    return { success: false, guest: null };
  }

  return { success: true, guest: data as Guest };
}

// 3. עדכון התשובה (נשאר ללא שינוי, כי ה-ID של האורח כבר ייחודי)
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

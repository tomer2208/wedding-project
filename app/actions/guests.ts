"use server";

import { createClient } from "@/utils/supabase/server";
import { bulkCreateCategories, ensureCategoryExists } from "./categories";
import { randomUUID } from "crypto";

// שליפת כל האורחים
export async function getGuests() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, guests: data };
}

// הוספת אורח בודד
export async function addGuest(guestData: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  if (guestData.relationship) {
    await ensureCategoryExists(guestData.relationship);
  }

  // הפתרון: אנחנו מייצרים ID ייחודי בעצמנו!
  const cleanData = {
    id: randomUUID(), // <--- הנה הקסם שפותר את השגיאה
    name: guestData.name,
    phone: guestData.phone || "",
    side: guestData.side || "Joint",
    relationship: guestData.relationship || "אחר",
    ageGroup: guestData.ageGroup || "Adults",
    expectedGuests: Number(guestData.expectedGuests) || 1,
    status: guestData.status || "Pending",
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from("guests")
    .insert([cleanData])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, guest: data };
}

// עדכון פרטי אורח
export async function updateGuest(guestId: string, updates: any) {
  const supabase = await createClient();

  if (updates.relationship) {
    await ensureCategoryExists(updates.relationship);
  }

  const { error } = await supabase
    .from("guests")
    .update(updates)
    .eq("id", guestId);

  return { success: !error, error: error?.message };
}

// מחיקת אורח
export async function deleteGuest(guestId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("guests").delete().eq("id", guestId);

  return { success: !error, error: error?.message };
}

// מחיקת כל האורחים של המשתמש
export async function deleteAllGuests() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("user_id", user.id);

  return { success: !error, error: error?.message };
}

// ייבוא המוני מאקסל
export async function uploadGuestsFromExcel(rawGuests: any[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const uniqueRelationships = Array.from(
      new Set(rawGuests.map((g) => g.relationship?.trim()).filter(Boolean)),
    ) as string[];

    if (uniqueRelationships.length > 0) {
      await bulkCreateCategories(uniqueRelationships);
    }

    // התיקון לקריאה מהאקסל - שימוש ב-name וב-expectedGuests
    const guestsToInsert = rawGuests.map((guest) => ({
      id: randomUUID(), // המזהה הייחודי שסידרנו קודם
      user_id: user.id,
      name: guest.name,
      phone: guest.phone,
      relationship: guest.relationship,
      side: guest.side,
      expectedGuests: guest.expectedGuests,
      status: guest.status,
      ageGroup: guest.ageGroup,
    }));

    const { error: guestError } = await supabase
      .from("guests")
      .insert(guestsToInsert);

    if (guestError) throw guestError;

    return { success: true };
  } catch (error: any) {
    console.error("Excel Upload Error:", error);
    return { success: false, error: error.message };
  }
}

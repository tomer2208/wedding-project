"use server";

import { createClient } from "@/utils/supabase/server"; // ודא שהנתיב תואם לפרויקט שלך

export async function saveSeatingPlan(planData: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.from("seating_plans").upsert(
    {
      user_id: user.id,
      plan_data: planData,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  ); // דורס את הסידור הקודם

  return { success: !error, error: error?.message };
}

export async function loadSeatingPlan() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, data: null };

  const { data, error } = await supabase
    .from("seating_plans")
    .select("plan_data")
    .eq("user_id", user.id)
    .single();

  if (error || !data) return { success: false, data: null };
  return { success: true, data: data.plan_data };
}

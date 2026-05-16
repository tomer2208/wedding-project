"use server";

import { createClient } from "@/utils/supabase/server";

export async function getCategories() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, categories: data };
}

export async function ensureCategoryExists(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("categories")
    .upsert({ user_id: user.id, name: name }, { onConflict: "user_id, name" })
    .select()
    .single();

  if (error && error.code !== "23505") {
    return { success: false, error: error.message };
  }

  return { success: true, category: data };
}

export async function bulkCreateCategories(names: string[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const categoriesToInsert = names.map((name) => ({
    user_id: user.id,
    name: name.trim(),
  }));

  const { error } = await supabase
    .from("categories")
    .upsert(categoriesToInsert, { onConflict: "user_id, name" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

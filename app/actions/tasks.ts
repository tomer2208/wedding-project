"use server";

import { createClient } from "@/utils/supabase/server";

export async function getTasks() {
  const supabase = await createClient(); // הוספנו await
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { success: false, error: "Not authenticated" };

  let { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true });

  if (error) return { success: false, error: error.message };

  if (tasks && tasks.length === 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wedding_date")
      .eq("id", session.user.id)
      .single();

    if (profile?.wedding_date) {
      await supabase.rpc("generate_default_tasks", {
        p_user_id: session.user.id,
        p_wedding_date: profile.wedding_date,
      });

      const { data: newTasks } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true });
      tasks = newTasks;
    }
  }

  return { success: true, tasks };
}

export async function addTask(
  title: string,
  dueDate: string,
  assignedTo: string,
) {
  const supabase = await createClient(); // הוספנו await
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Not authenticated - Please log in again" };
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    due_date: dueDate,
    assigned_to: assignedTo,
    status: "Not Started",
  });

  if (error) {
    console.error("Error inserting task:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient(); // הוספנו await
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  return { success: !error };
}

export async function updateTask(taskId: string, updates: any) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId);

  return { success: !error };
}

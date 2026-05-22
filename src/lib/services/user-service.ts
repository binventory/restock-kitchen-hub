import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type UserPreferences = Database["public"]["Tables"]["user_preferences"]["Row"];

export async function getPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    console.error("[getPreferences]", error);
    return null;
  }
  return data;
}

export async function updatePreferences(
  userId: string,
  patch: Partial<Database["public"]["Tables"]["user_preferences"]["Update"]>,
) {
  const { error } = await supabase.from("user_preferences").update(patch).eq("user_id", userId);
  if (error) {
    console.error("[updatePreferences]", error);
    throw new Error("Could not save preferences. Please try again.");
  }
}

export async function requestDataExport(userId: string) {
  const { error } = await supabase.rpc("request_data_export", { _user_id: userId });
  if (error) {
    console.error("[requestDataExport]", error);
    throw new Error("Could not request an export. Please try again later.");
  }
}

export async function deleteOwnAccount() {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("[deleteOwnAccount]", error);
    throw new Error("Could not delete your account.");
  }
}

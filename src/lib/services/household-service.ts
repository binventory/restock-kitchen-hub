import { supabase } from "@/integrations/supabase/client";

export interface HouseholdRow { id: string; name: string; }

export async function createHousehold(name: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_household", { _name: name });
  if (error) throw error;
  return data as string;
}

export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc("accept_invite", { _token: token });
  if (error) throw error;
  return data as string;
}

export async function setDefaultHousehold(userId: string, householdId: string) {
  await supabase.from("household_members").update({ is_default: false }).eq("user_id", userId);
  const { error } = await supabase
    .from("household_members")
    .update({ is_default: true })
    .eq("user_id", userId)
    .eq("household_id", householdId);
  if (error) throw error;
}

export async function leaveHousehold(userId: string, householdId: string) {
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("user_id", userId)
    .eq("household_id", householdId);
  if (error) throw error;
}

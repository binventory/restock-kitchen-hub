import { supabase } from "@/integrations/supabase/client";

export interface HouseholdRow {
  id: string;
  name: string;
}

/**
 * Map any error coming back from a Supabase RPC / query to a short,
 * generic user-facing string. Raw error.message values may include
 * Postgres constraint names, table names, RAISE EXCEPTION text or
 * internal paths and must never be displayed verbatim.
 */
export function friendlyHouseholdError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  const lower = raw.toLowerCase();
  if (lower.includes("not authenticated")) return "You need to be signed in.";
  if (lower.includes("invalid or used invite")) return "This invite is invalid or has already been used.";
  if (lower.includes("forbidden")) return "You don't have permission to do that.";
  if (lower.includes("duplicate") || lower.includes("unique")) return "You're already part of this household.";
  return fallback;
}

export async function createHousehold(name: string): Promise<string> {
  const { data, error } = await supabase.rpc("create_household", { _name: name });
  if (error) {
    console.error("[create household]", error);
    throw new Error(friendlyHouseholdError(error, "Could not create household. Please try again."));
  }
  return data as string;
}

export async function acceptInvite(token: string): Promise<string> {
  const { data, error } = await supabase.rpc("accept_invite", { _token: token });
  if (error) {
    console.error("[accept invite]", error);
    throw new Error(friendlyHouseholdError(error, "Could not accept the invite."));
  }
  return data as string;
}

export async function setDefaultHousehold(userId: string, householdId: string) {
  await supabase.from("household_members").update({ is_default: false }).eq("user_id", userId);
  const { error } = await supabase
    .from("household_members")
    .update({ is_default: true })
    .eq("user_id", userId)
    .eq("household_id", householdId);
  if (error) {
    console.error("[set default household]", error);
    throw new Error("Could not change the default household.");
  }
}

export async function leaveHousehold(userId: string, householdId: string) {
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("user_id", userId)
    .eq("household_id", householdId);
  if (error) {
    console.error("[leave household]", error);
    throw new Error("Could not leave the household.");
  }
}

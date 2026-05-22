import { supabase } from "@/integrations/supabase/client";

/**
 * Update the needed quantity for a shopping list item.
 * If newQty is 0 or less, the item is removed from the list entirely.
 * Scoped by householdId to prevent cross-household writes.
 */
export async function updateShoppingListQuantity(
  itemId: string,
  householdId: string,
  newQty: number,
): Promise<void> {
  const safe = Math.max(0, Math.floor(newQty));
  if (safe === 0) {
    await supabase
      .from("shopping_list")
      .delete()
      .eq("id", itemId)
      .eq("household_id", householdId);
    return;
  }
  await supabase
    .from("shopping_list")
    .update({ needed_quantity: safe })
    .eq("id", itemId)
    .eq("household_id", householdId);
}

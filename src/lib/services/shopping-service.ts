import { supabase } from "@/integrations/supabase/client";

export interface ShoppingItem {
  id: string;
  household_id: string;
  product_id: string | null;
  user_product_id: string | null;
  custom_text: string | null;
  custom_image_url: string | null;
  item_note: string | null;
  needed_quantity: number;
  bought_quantity: number;
  is_checked: boolean;
  added_automatically: boolean;
  added_by: string | null;
  product: {
    id: string;
    name: string;
    brand: string | null;
    image_url: string | null;
    barcode: string | null;
  } | null;
}

export async function getShoppingList(householdId: string): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from("shopping_list")
    .select(
      "*, products(id, name, brand, image_url, barcode), user_products(id, name, brand, image_url, barcode)",
    )
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    ...r,
    needed_quantity: Number(r.needed_quantity),
    bought_quantity: Number(r.bought_quantity),
    product:
      (r.products as ShoppingItem["product"]) ?? (r.user_products as ShoppingItem["product"]),
  })) as ShoppingItem[];
}

export async function addShoppingItem(input: {
  household_id: string;
  added_by: string;
  product_id?: string;
  user_product_id?: string;
  custom_text?: string;
  item_note?: string;
  custom_image_url?: string;
  needed_quantity?: number;
}): Promise<void> {
  await supabase.from("shopping_list").insert({
    household_id: input.household_id,
    added_by: input.added_by,
    product_id: input.product_id ?? null,
    user_product_id: input.user_product_id ?? null,
    custom_text: input.custom_text ?? null,
    item_note: input.item_note ?? null,
    custom_image_url: input.custom_image_url ?? null,
    needed_quantity: input.needed_quantity ?? 1,
  });
}

export async function setChecked(item: ShoppingItem, checked: boolean, bought?: number): Promise<void> {
  await supabase
    .from("shopping_list")
    .update({
      is_checked: checked,
      bought_quantity: checked ? (bought ?? item.needed_quantity) : 0,
    })
    .eq("id", item.id);
}

export async function deleteShoppingItem(id: string): Promise<void> {
  await supabase.from("shopping_list").delete().eq("id", id);
}

export async function clearChecked(householdId: string): Promise<void> {
  await supabase.from("shopping_list").delete().eq("household_id", householdId).eq("is_checked", true);
}

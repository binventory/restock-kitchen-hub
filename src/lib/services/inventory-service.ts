import { supabase } from "@/integrations/supabase/client";

export interface InventoryItem {
  id: string;
  household_id: string;
  product_id: string | null;
  user_product_id: string | null;
  section_id: string | null;
  product_group_id: string | null;
  quantity: number;
  limit_threshold: number;
  unit: string;
  expiry_date: string | null;
  product: {
    id: string;
    name: string;
    brand: string | null;
    image_url: string | null;
    barcode: string | null;
  } | null;
}

interface Opts {
  search?: string;
  filter?: "all" | "low" | "out";
  sort?: "name" | "qty_asc" | "low_first";
  limit?: number;
  offset?: number;
}

export async function getInventory(householdId: string, opts: Opts = {}): Promise<InventoryItem[]> {
  const { limit = 20, offset = 0, filter = "all", sort = "name", search = "" } = opts;

  let q = supabase
    .from("inventory")
    .select(
      "id, household_id, product_id, user_product_id, section_id, product_group_id, quantity, limit_threshold, unit, expiry_date, products(id, name, brand, image_url, barcode), user_products(id, name, brand, image_url, barcode)",
    )
    .eq("household_id", householdId);

  if (filter === "out") q = q.eq("quantity", 0);

  if (sort === "name") q = q.order("created_at", { ascending: true });
  else if (sort === "qty_asc") q = q.order("quantity", { ascending: true });

  q = q.range(offset, offset + limit - 1);

  const { data, error } = await q;
  if (error || !data) return [];

  let items: InventoryItem[] = data.map((r) => {
    const prod = (r.products as InventoryItem["product"]) ?? (r.user_products as InventoryItem["product"]);
    return {
      id: r.id,
      household_id: r.household_id,
      product_id: r.product_id,
      user_product_id: r.user_product_id,
      section_id: r.section_id,
      product_group_id: r.product_group_id,
      quantity: Number(r.quantity),
      limit_threshold: Number(r.limit_threshold),
      unit: r.unit,
      expiry_date: r.expiry_date,
      product: prod,
    };
  });

  if (search) {
    const s = search.toLowerCase();
    items = items.filter(
      (i) => i.product?.name.toLowerCase().includes(s) || (i.product?.brand ?? "").toLowerCase().includes(s),
    );
  }
  if (filter === "low") items = items.filter((i) => i.quantity <= i.limit_threshold && i.quantity > 0);
  if (sort === "low_first") items.sort((a, b) => a.quantity - a.limit_threshold - (b.quantity - b.limit_threshold));
  if (sort === "name") items.sort((a, b) => (a.product?.name ?? "").localeCompare(b.product?.name ?? ""));
  return items;
}

export async function updateQuantity(itemId: string, newQty: number): Promise<void> {
  await supabase
    .from("inventory")
    .update({ quantity: Math.max(0, newQty) })
    .eq("id", itemId);
}

/**
 * Add product to inventory. If the product is already in inventory
 * (same household + same product/user_product), increment the
 * quantity instead of creating a duplicate row.
 */
export async function addToInventory(
  householdId: string,
  ref: { product_id?: string; user_product_id?: string },
  quantity: number,
  limit: number,
  unit: string,
): Promise<string | null> {
  // Reject temporary "off_" IDs that are not valid UUIDs.
  // Caller must first save product to user_products to get a real UUID.
  if (ref.product_id && ref.product_id.startsWith("off_")) return null;
  if (ref.user_product_id && ref.user_product_id.startsWith("off_")) return null;

  // First check if a row already exists for this product
  const col = ref.product_id ? "product_id" : "user_product_id";
  const refId = ref.product_id ?? ref.user_product_id;
  if (!refId) return null;

  const { data: existing } = await supabase
    .from("inventory")
    .select("id, quantity")
    .eq("household_id", householdId)
    .eq(col, refId)
    .maybeSingle();

  if (existing) {
    // Already in inventory — increment quantity, keep existing limit/unit
    const newQty = Number(existing.quantity) + quantity;
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", existing.id);
    return existing.id;
  }

  // Not in inventory yet — insert a new row
  const { data } = await supabase
    .from("inventory")
    .insert({
      household_id: householdId,
      product_id: ref.product_id ?? null,
      user_product_id: ref.user_product_id ?? null,
      quantity,
      limit_threshold: limit,
      unit: unit as "pieces",
    })
    .select("id")
    .single();
  return data?.id ?? null;
}

export async function removeFromInventory(itemId: string): Promise<void> {
  await supabase.from("inventory").delete().eq("id", itemId);
}

export async function getLowStockItems(householdId: string): Promise<InventoryItem[]> {
  const all = await getInventory(householdId, { limit: 200 });
  return all.filter((i) => i.quantity <= i.limit_threshold);
}

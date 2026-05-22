import { supabase } from "@/integrations/supabase/client";
import type { ResolvedProduct } from "@/lib/types/product";

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
  try {
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
    if (error || !data) {
      if (error) console.error("[getInventory]", error);
      return [];
    }

    // Defensive client-side de-dup: build a fresh accumulator instead
    // of mutating the rows Supabase returned (which may be frozen).
    const acc = new Map<string, InventoryItem>();
    for (const r of data) {
      const key = r.product_id ? `p:${r.product_id}` : r.user_product_id ? `u:${r.user_product_id}` : `i:${r.id}`;
      const prod = (r.products as InventoryItem["product"]) ?? (r.user_products as InventoryItem["product"]);
      const next: InventoryItem = {
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
      const existing = acc.get(key);
      if (existing) {
        acc.set(key, { ...existing, quantity: existing.quantity + next.quantity });
      } else {
        acc.set(key, next);
      }
    }

    let items: InventoryItem[] = Array.from(acc.values());

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
  } catch (e) {
    console.error("[getInventory] unexpected", e);
    return [];
  }
}

export async function fetchFullProduct(
  productId: string | null,
  userProductId: string | null,
): Promise<ResolvedProduct | null> {
  const table = productId ? "products" : "user_products";
  const id = productId ?? userProductId;
  if (!id) return null;

  const { data: raw, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (error || !raw) return null;
  const data = raw as Record<string, unknown>;

  return {
    id: String(data.id),
    type: productId ? "global" : "user",
    tableSource: productId ? "products" : "user_products",
    barcode: (data.barcode as string) ?? "",
    name: (data.name as string) ?? "—",
    brand: (data.brand as string | null) ?? null,
    generic_name: (data.generic_name as string | null) ?? null,
    category: (data.category as string | null) ?? null,
    image_url: (data.image_url as string | null) ?? null,
    quantity_value: (data.quantity_value as number | null) ?? null,
    quantity_unit: (data.quantity_unit as string | null) ?? null,
    calories_100g: (data.calories_100g as number | null) ?? null,
    fat_100g: (data.fat_100g as number | null) ?? null,
    saturated_fat_100g: (data.saturated_fat_100g as number | null) ?? null,
    carbohydrates_100g: (data.carbohydrates_100g as number | null) ?? null,
    sugars_100g: (data.sugars_100g as number | null) ?? null,
    proteins_100g: (data.proteins_100g as number | null) ?? null,
    salt_100g: (data.salt_100g as number | null) ?? null,
    fiber_100g: (data.fiber_100g as number | null) ?? null,
    serving_size_g: (data.serving_size_g as number | null) ?? null,
    calories_serving: (data.calories_serving as number | null) ?? null,
    nutriscore: (data.nutriscore as ResolvedProduct["nutriscore"]) ?? null,
    ecoscore: (data.ecoscore as ResolvedProduct["ecoscore"]) ?? null,
    nova_group: (data.nova_group as ResolvedProduct["nova_group"]) ?? null,
    nutrient_levels: (data.nutrient_levels as Record<string, string> | null) ?? null,
    allergens: (data.allergens as string[] | null) ?? [],
    traces_allergens: (data.traces_allergens as string[] | null) ?? [],
    labels: (data.labels as string[] | null) ?? [],
    is_vegan: (data.is_vegan as boolean | null) ?? null,
    is_vegetarian: (data.is_vegetarian as boolean | null) ?? null,
    is_gluten_free: (data.is_gluten_free as boolean | null) ?? null,
    has_palm_oil: (data.has_palm_oil as boolean | null) ?? null,
    halal_certified: (data.halal_certified as boolean | null) ?? null,
    ingredients_text: (data.ingredients_text as string | null) ?? null,
    ingredients_analysis: (data.ingredients_analysis as string[] | null) ?? [],
    available_stores: (data.available_stores as string[] | null) ?? [],
  };
}

async function autoDetectGroup(
  productName: string,
): Promise<{ section_id: string | null; product_group_id: string | null }> {
  const lower = productName.toLowerCase();
  const { data: groups } = await supabase.from("product_groups").select("id, section_id, keywords");
  if (!groups) return { section_id: null, product_group_id: null };
  for (const g of groups) {
    const kw = (g.keywords as string[] | null) ?? [];
    if (kw.some((k) => lower.includes(k.toLowerCase()))) {
      return {
        section_id: (g.section_id as string | null) ?? null,
        product_group_id: (g.id as string) ?? null,
      };
    }
  }
  return { section_id: null, product_group_id: null };
}

export async function updateQuantity(itemId: string, newQty: number): Promise<void> {
  const safe = Math.max(0, newQty);

  const { data: row } = await supabase
    .from("inventory")
    .select("household_id, product_id, user_product_id, limit_threshold, quantity")
    .eq("id", itemId)
    .maybeSingle();

  await supabase.from("inventory").update({ quantity: safe }).eq("id", itemId);

  if (!row) return;
  const limit = Number(row.limit_threshold);
  const wasAbove = Number(row.quantity) > limit;
  const nowBelow = safe <= limit;

  if (!wasAbove || !nowBelow) return;

  const col = row.product_id ? "product_id" : "user_product_id";
  const refId = row.product_id ?? row.user_product_id;
  if (!refId) return;

  const { data: existing } = await supabase
    .from("shopping_list")
    .select("id")
    .eq("household_id", row.household_id)
    .eq("is_checked", false)
    .eq(col, refId)
    .maybeSingle();

  if (existing) return;

  await supabase.from("shopping_list").insert({
    household_id: row.household_id,
    [col]: refId,
    needed_quantity: 1,
    added_automatically: true,
  } as never);
}

export async function addToInventory(
  householdId: string,
  ref: { product_id?: string; user_product_id?: string },
  quantity: number,
  limit: number,
  unit: string,
  productName?: string,
): Promise<string | null> {
  if (ref.product_id && ref.product_id.startsWith("off_")) return null;
  if (ref.user_product_id && ref.user_product_id.startsWith("off_")) return null;

  const col = ref.product_id ? "product_id" : "user_product_id";
  const refId = ref.product_id ?? ref.user_product_id;
  if (!refId) return null;

  const { data: existingList } = await supabase
    .from("inventory")
    .select("id, quantity")
    .eq("household_id", householdId)
    .eq(col, refId)
    .order("created_at", { ascending: true })
    .limit(1);

  if (existingList && existingList.length > 0) {
    const existing = existingList[0];
    const newQty = Number(existing.quantity) + quantity;
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", existing.id);
    return existing.id;
  }

  let section_id: string | null = null;
  let product_group_id: string | null = null;
  if (productName) {
    const detected = await autoDetectGroup(productName);
    section_id = detected.section_id;
    product_group_id = detected.product_group_id;
  }

  const { data, error } = await supabase
    .from("inventory")
    .insert({
      household_id: householdId,
      product_id: ref.product_id ?? null,
      user_product_id: ref.user_product_id ?? null,
      quantity,
      limit_threshold: limit,
      unit: unit as "pieces",
      section_id,
      product_group_id,
    })
    .select("id")
    .single();

  if (error) {
    const { data: retry } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("household_id", householdId)
      .eq(col, refId)
      .order("created_at", { ascending: true })
      .limit(1);
    if (retry && retry.length > 0) {
      const winner = retry[0];
      const newQty = Number(winner.quantity) + quantity;
      await supabase.from("inventory").update({ quantity: newQty }).eq("id", winner.id);
      return winner.id;
    }
    console.error("[addToInventory]", error);
    return null;
  }
  return data?.id ?? null;
}

export async function removeFromInventory(itemId: string): Promise<void> {
  await supabase.from("inventory").delete().eq("id", itemId);
}

export async function getLowStockItems(householdId: string): Promise<InventoryItem[]> {
  const all = await getInventory(householdId, { limit: 200 });
  return all.filter((i) => i.quantity <= i.limit_threshold);
}

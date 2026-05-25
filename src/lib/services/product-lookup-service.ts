import { supabase } from "@/integrations/supabase/client";
import { ingestOpenFoodFactsProduct } from "./openfoodfacts-ingest.functions";
import type { ResolvedProduct } from "@/lib/types/product";

function rowToResolved(
  row: Record<string, unknown>,
  type: ResolvedProduct["type"],
  tableSource: ResolvedProduct["tableSource"],
): ResolvedProduct {
  return {
    id: String(row.id),
    type,
    tableSource,
    barcode: (row.barcode as string) ?? "",
    name: (row.name as string) ?? "",
    brand: (row.brand as string | null) ?? null,
    generic_name: (row.generic_name as string | null) ?? null,
    category: (row.category as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    quantity_value: (row.quantity_value as number | null) ?? null,
    quantity_unit: (row.quantity_unit as string | null) ?? null,
    calories_100g: (row.calories_100g as number | null) ?? null,
    fat_100g: (row.fat_100g as number | null) ?? null,
    saturated_fat_100g: (row.saturated_fat_100g as number | null) ?? null,
    carbohydrates_100g: (row.carbohydrates_100g as number | null) ?? null,
    sugars_100g: (row.sugars_100g as number | null) ?? null,
    proteins_100g: (row.proteins_100g as number | null) ?? null,
    salt_100g: (row.salt_100g as number | null) ?? null,
    fiber_100g: (row.fiber_100g as number | null) ?? null,
    serving_size_g: (row.serving_size_g as number | null) ?? null,
    calories_serving: (row.calories_serving as number | null) ?? null,
    nutriscore: (row.nutriscore as ResolvedProduct["nutriscore"]) ?? null,
    ecoscore: (row.ecoscore as ResolvedProduct["ecoscore"]) ?? null,
    nova_group: (row.nova_group as ResolvedProduct["nova_group"]) ?? null,
    nutrient_levels: (row.nutrient_levels as Record<string, string> | null) ?? null,
    allergens: (row.allergens as string[] | null) ?? [],
    traces_allergens: (row.traces_allergens as string[] | null) ?? [],
    labels: (row.labels as string[] | null) ?? [],
    is_vegan: (row.is_vegan as boolean | null) ?? null,
    is_vegetarian: (row.is_vegetarian as boolean | null) ?? null,
    is_gluten_free: (row.is_gluten_free as boolean | null) ?? null,
    has_palm_oil: (row.has_palm_oil as boolean | null) ?? null,
    halal_certified: (row.halal_certified as boolean | null) ?? null,
    ingredients_text: (row.ingredients_text as string | null) ?? null,
    ingredients_analysis: (row.ingredients_analysis as string[] | null) ?? [],
    available_stores: (row.available_stores as string[] | null) ?? [],
  };
}


export async function lookupBarcode(
  barcode: string,
  userId: string,
  _householdId: string,
): Promise<ResolvedProduct | null> {
  // Step 1: rejected
  const { data: rejected } = await supabase
    .from("rejected_forever_products")
    .select("barcode, name")
    .eq("barcode", barcode)
    .maybeSingle();
  if (rejected) {
    const { data: up } = await supabase
      .from("user_products")
      .insert({
        barcode,
        name: rejected.name ?? barcode,
        submission_status: "local_only",
        user_id: userId,
      })
      .select("*")
      .single();
    if (up) {
      const r = rowToResolved(up, "rejected", "user_products");
      r.isRejected = true;
      return r;
    }
  }

  // Step 2: global products
  const { data: global } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .eq("is_approved", true)
    .maybeSingle();
  if (global) return rowToResolved(global, "global", "products");

  // Step 3: user_products from any household member
  const { data: hm } = await supabase
    .from("household_members")
    .select("user_id")
    .eq("household_id", _householdId);
  const ids = (hm ?? []).map((r) => r.user_id);
  if (ids.length > 0) {
    const { data: up } = await supabase
      .from("user_products")
      .select("*")
      .eq("barcode", barcode)
      .in("user_id", ids)
      .maybeSingle();
    if (up) return rowToResolved(up, "user", "user_products");
  }

  // Step 4: OpenFoodFacts
  // 4a. Try server-side ingest first.
  try {
    const ingest = await ingestOpenFoodFactsProduct({
      data: { barcode },
    });
    if (ingest?.product) {
      return rowToResolved(
        ingest.product as unknown as Record<string, unknown>,
        "global",
        "products",
      );
    }
  } catch {
    // Server function unavailable — fall through.
  }

  // Step 4b removed: client-side inserts into `products` are not permitted.
  // All OpenFoodFacts ingestion must go through the server function above,
  // which validates the barcode and uses the admin client.
  return null;
}

  return null;
}

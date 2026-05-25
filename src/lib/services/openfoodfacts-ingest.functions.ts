import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Schema = z.object({
  barcode: z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
});

// Server-only ingest of an OpenFoodFacts product into the global catalog.
// Bypasses RLS via the admin client. Client cannot self-approve products.
export const ingestOpenFoodFactsProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const { barcode } = data;

    // If already present, return it.
    const existing = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .eq("is_approved", true)
      .maybeSingle();
    if (existing.data) return { product: existing.data };

    // Fetch from OpenFoodFacts (server-side).
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
    );
    if (!res.ok) return { product: null };
    const json = (await res.json()) as {
      status?: number;
      product?: Record<string, unknown>;
    };
    if (json.status !== 1 || !json.product) return { product: null };

    const p = json.product;
    const n = (p.nutriments ?? {}) as Record<string, number | undefined>;
    const clean = (s: string) =>
      s.replace(/^en:/, "").replace(/-/g, " ").trim();
    const tags = (k: string) =>
      ((p[k] as string[] | undefined) ?? []).map(clean);
    const rawTags = (k: string) => (p[k] as string[] | undefined) ?? [];
    const str = (k: string) => (p[k] as string | undefined) ?? null;
    const num = (k: string) => {
      const v = p[k];
      return typeof v === "number" ? v : null;
    };
    const grade = (s: string | null) => {
      if (!s) return null;
      const u = s.toUpperCase();
      return ["A", "B", "C", "D", "E"].includes(u) ? u : null;
    };
    const labels = tags("labels_tags");
    const analysis = rawTags("ingredients_analysis_tags");
    const novaRaw = num("nova_group");

    const insertRow = {
      barcode,
      name:
        str("product_name_en") ??
        str("product_name") ??
        str("generic_name_en") ??
        barcode,
      brand: (str("brands") ?? "").split(",")[0]?.trim() || null,
      generic_name: str("generic_name_en") ?? str("generic_name"),
      category: (str("categories") ?? "").split(",")[0]?.trim() || null,
      food_group: (() => {
        const t = rawTags("food_groups_tags")[0];
        return t ? t.replace(/^en:/, "").replace(/-/g, " ").trim().toLowerCase() : null;
      })(),
      image_url: str("image_front_url") ?? str("image_url"),
      quantity_value: num("product_quantity"),
      quantity_unit: str("product_quantity_unit"),
      calories_100g: n["energy-kcal_100g"] ?? null,
      fat_100g: n["fat_100g"] ?? null,
      saturated_fat_100g: n["saturated-fat_100g"] ?? null,
      carbohydrates_100g: n["carbohydrates_100g"] ?? null,
      sugars_100g: n["sugars_100g"] ?? null,
      proteins_100g: n["proteins_100g"] ?? null,
      salt_100g: n["salt_100g"] ?? null,
      fiber_100g: n["fiber_100g"] ?? null,
      serving_size_g: num("serving_quantity"),
      calories_serving: n["energy-kcal_serving"] ?? null,
      nutriscore: grade(str("nutriscore_grade")),
      ecoscore: grade(str("ecoscore_grade")),
      nova_group:
        novaRaw && [1, 2, 3, 4].includes(novaRaw) ? novaRaw : null,
      nutrient_levels:
        (p.nutrient_levels as Record<string, string> | undefined) ?? null,
      allergens: tags("allergens_tags"),
      traces_allergens: tags("traces_tags"),
      labels,
      is_vegan: analysis.includes("en:vegan") ? true : null,
      is_vegetarian: analysis.includes("en:vegetarian") ? true : null,
      is_gluten_free:
        labels.some(
          (l) => l.includes("gluten free") || l.includes("no gluten"),
        ) || null,
      has_palm_oil:
        analysis.some(
          (a) => a.includes("palm-oil") && !a.includes("no-palm"),
        ) || null,
      halal_certified:
        labels.some((l) => l.toLowerCase().includes("halal")) || null,
      ingredients_text:
        str("ingredients_text_en") ?? str("ingredients_text"),
      ingredients_analysis: analysis,
      available_stores: rawTags("stores_tags"),
      source: "openfoodfacts" as const,
      is_approved: true,
      submitted_by_user_id: null,
    };

    const inserted = await supabaseAdmin
      .from("products")
      .insert(insertRow as never)
      .select("*")
      .single();
    return { product: inserted.data ?? null };
  });

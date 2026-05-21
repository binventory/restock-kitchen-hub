import { supabase } from "@/integrations/supabase/client";
import type { OffProduct, Grade } from "@/lib/types/product";

// Use the PRODUCTION OpenFoodFacts API (.org).
// The .net domain is STAGING and requires Basic Auth (off:off)
// per the official docs — using it without auth returns 401
// and the product lookup silently fails.
// Docs: https://wiki.openfoodfacts.org/API
const DEFAULT_URL = "https://world.openfoodfacts.org/api/v2/product";
let cachedBase: string | null = null;

async function getBaseUrl(): Promise<string> {
  if (cachedBase) return cachedBase;
  const { data } = await supabase.from("app_settings").select("value").eq("key", "openfoodfacts_api_url").maybeSingle();
  // Safety net: if the database still has the staging .net domain,
  // ignore it and force the production .org default. This protects
  // us if the SQL update was missed or a fresh install gets old seed.
  const v = data?.value;
  if (!v || v.includes("openfoodfacts.net")) {
    cachedBase = DEFAULT_URL;
  } else {
    cachedBase = v;
  }
  return cachedBase;
}

const clean = (s: string) => s.replace(/^en:/, "").replace(/-/g, " ").trim();

function grade(s: string | undefined | null): Grade {
  if (!s) return null;
  const u = s.toUpperCase();
  return ["A", "B", "C", "D", "E"].includes(u) ? (u as Grade) : null;
}

function storeName(s: string): string {
  return s
    .replace(/^en:/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function fetchFromOpenFoodFacts(barcode: string): Promise<OffProduct | null> {
  const base = await getBaseUrl();
  try {
    const res = await fetch(`${base}/${barcode}.json`);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status?: number;
      product?: Record<string, unknown>;
    };
    if (json.status !== 1 || !json.product) return null;
    return parseOff(barcode, json.product);
  } catch {
    return null;
  }
}

function parseOff(barcode: string, p: Record<string, unknown>): OffProduct {
  const n = (p.nutriments ?? {}) as Record<string, number | undefined>;
  const tags = (k: string) => ((p[k] as string[] | undefined) ?? []).map(clean);
  const rawTags = (k: string) => (p[k] as string[] | undefined) ?? [];
  const str = (k: string) => (p[k] as string | undefined) ?? null;
  const num = (k: string) => {
    const v = p[k];
    return typeof v === "number" ? v : null;
  };
  const labels = tags("labels_tags");
  const analysis = rawTags("ingredients_analysis_tags");
  const allergens = tags("allergens_tags");
  const name = str("product_name_en") ?? str("product_name") ?? str("generic_name_en") ?? barcode;
  const brand = (str("brands") ?? "").split(",")[0]?.trim() || null;
  const novaRaw = num("nova_group");
  const nova = novaRaw && [1, 2, 3, 4].includes(novaRaw) ? (novaRaw as 1 | 2 | 3 | 4) : null;
  return {
    barcode,
    name,
    brand,
    generic_name: str("generic_name_en") ?? str("generic_name"),
    category: (str("categories") ?? "").split(",")[0]?.trim() || null,
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
    nova_group: nova,
    nutrient_levels: (p.nutrient_levels as Record<string, string> | undefined) ?? null,
    allergens,
    traces_allergens: tags("traces_tags"),
    labels,
    is_vegan: analysis.includes("en:vegan") ? true : null,
    is_vegetarian: analysis.includes("en:vegetarian") ? true : null,
    is_gluten_free: labels.some((l) => l.includes("gluten free") || l.includes("no gluten")) || null,
    has_palm_oil: analysis.some((a) => a.includes("palm-oil") && !a.includes("no-palm")) || null,
    halal_certified: labels.some((l) => l.toLowerCase().includes("halal")) || null,
    ingredients_text: str("ingredients_text_en") ?? str("ingredients_text"),
    ingredients_analysis: analysis,
    available_stores: rawTags("stores_tags").map(storeName),
  };
}

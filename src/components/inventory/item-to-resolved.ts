import type { InventoryItem } from "@/lib/services/inventory-service";
import type { ResolvedProduct } from "@/lib/types/product";

export function itemToResolved(it: InventoryItem): ResolvedProduct {
  const p = it.product;
  return {
    id: p?.id ?? it.id,
    type: it.product_id ? "global" : "user",
    tableSource: it.product_id ? "products" : "user_products",
    barcode: p?.barcode ?? "",
    name: p?.name ?? "—",
    brand: p?.brand ?? null,
    generic_name: null,
    category: null,
    image_url: p?.image_url ?? null,
    quantity_value: null,
    quantity_unit: null,
    calories_100g: null,
    fat_100g: null,
    saturated_fat_100g: null,
    carbohydrates_100g: null,
    sugars_100g: null,
    proteins_100g: null,
    salt_100g: null,
    fiber_100g: null,
    serving_size_g: null,
    calories_serving: null,
    nutriscore: null,
    ecoscore: null,
    nova_group: null,
    nutrient_levels: null,
    allergens: [],
    traces_allergens: [],
    labels: [],
    is_vegan: null,
    is_vegetarian: null,
    is_gluten_free: null,
    has_palm_oil: null,
    halal_certified: null,
    ingredients_text: null,
    ingredients_analysis: [],
    available_stores: [],
  };
}

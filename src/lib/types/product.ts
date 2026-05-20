export type Grade = "A" | "B" | "C" | "D" | "E" | null;

export interface OffProduct {
  barcode: string;
  name: string;
  brand: string | null;
  generic_name: string | null;
  category: string | null;
  image_url: string | null;
  quantity_value: number | null;
  quantity_unit: string | null;
  calories_100g: number | null;
  fat_100g: number | null;
  saturated_fat_100g: number | null;
  carbohydrates_100g: number | null;
  sugars_100g: number | null;
  proteins_100g: number | null;
  salt_100g: number | null;
  fiber_100g: number | null;
  serving_size_g: number | null;
  calories_serving: number | null;
  nutriscore: Grade;
  ecoscore: Grade;
  nova_group: 1 | 2 | 3 | 4 | null;
  nutrient_levels: Record<string, string> | null;
  allergens: string[];
  traces_allergens: string[];
  labels: string[];
  is_vegan: boolean | null;
  is_vegetarian: boolean | null;
  is_gluten_free: boolean | null;
  has_palm_oil: boolean | null;
  halal_certified: boolean | null;
  ingredients_text: string | null;
  ingredients_analysis: string[];
  available_stores: string[];
}

export interface ResolvedProduct extends OffProduct {
  id: string;
  type: "global" | "user" | "rejected";
  tableSource: "products" | "user_products";
  isRejected?: boolean;
}

export interface UserHealthProfile {
  is_diabetic: boolean;
  has_heart_condition: boolean;
  is_celiac: boolean;
  is_lactose_intolerant: boolean;
  allergens_to_avoid: string[];
  diet_mode: string | null;
  vegan: boolean;
  vegetarian: boolean;
  halal_only: boolean;
  calorie_goal_per_day: number | null;
}

export interface HealthWarning {
  level: "danger" | "warning" | "info";
  messageEn: string;
  icon: string;
}

export interface IngredientCheck {
  name: string;
  status: "ok" | "haram" | "unclear";
  reason: string;
}

export interface HalalStatus {
  status: "certified" | "halal" | "unclear" | "haram";
  summary: string;
  ingredients: IngredientCheck[];
}

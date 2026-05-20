import { supabase } from "@/integrations/supabase/client";
import type { UserHealthProfile } from "@/lib/types/product";

const FALLBACK: UserHealthProfile = {
  is_diabetic: false,
  has_heart_condition: false,
  is_celiac: false,
  is_lactose_intolerant: false,
  allergens_to_avoid: [],
  diet_mode: null,
  vegan: false,
  vegetarian: false,
  halal_only: false,
  calorie_goal_per_day: null,
};

export async function getHealthProfile(userId: string): Promise<UserHealthProfile> {
  const { data } = await supabase
    .from("user_health_profile")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return FALLBACK;
  return {
    is_diabetic: !!data.is_diabetic,
    has_heart_condition: !!data.has_heart_condition,
    is_celiac: !!data.is_celiac,
    is_lactose_intolerant: !!data.is_lactose_intolerant,
    allergens_to_avoid: data.allergens_to_avoid ?? [],
    diet_mode: data.diet_mode,
    vegan: !!data.vegan,
    vegetarian: !!data.vegetarian,
    halal_only: !!data.halal_only,
    calorie_goal_per_day: data.calorie_goal_per_day,
  };
}

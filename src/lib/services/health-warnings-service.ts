import type { ResolvedProduct, UserHealthProfile, HealthWarning } from "@/lib/types/product";

export function getHealthWarnings(
  product: ResolvedProduct,
  profile: UserHealthProfile,
): HealthWarning[] {
  const warnings: HealthWarning[] = [];
  const allergensLower = product.allergens.map((a) => a.toLowerCase());
  const tracesLower = product.traces_allergens.map((a) => a.toLowerCase());
  const avoidLower = profile.allergens_to_avoid.map((a) => a.toLowerCase());

  for (const a of avoidLower) {
    if (allergensLower.some((x) => x.includes(a))) {
      warnings.push({
        level: "danger",
        icon: "🚨",
        messageEn: `Contains ${a} — not safe for you`,
      });
    }
  }
  for (const a of avoidLower) {
    if (tracesLower.some((x) => x.includes(a)) && !allergensLower.some((x) => x.includes(a))) {
      warnings.push({
        level: "warning",
        icon: "⚠️",
        messageEn: `May contain traces of ${a}`,
      });
    }
  }
  if (profile.is_diabetic && (product.sugars_100g ?? 0) > 20) {
    warnings.push({
      level: "warning",
      icon: "⚠️",
      messageEn: `High sugar: ${product.sugars_100g}g per 100g`,
    });
  }
  if (profile.has_heart_condition && (product.saturated_fat_100g ?? 0) > 5) {
    warnings.push({
      level: "warning",
      icon: "⚠️",
      messageEn: `High saturated fat: ${product.saturated_fat_100g}g per 100g`,
    });
  }
  if (profile.is_celiac && !product.is_gluten_free && allergensLower.some((a) => a.includes("gluten"))) {
    warnings.push({ level: "danger", icon: "🚨", messageEn: "Contains gluten" });
  }
  if (profile.is_lactose_intolerant && allergensLower.some((a) => a.includes("milk"))) {
    warnings.push({ level: "warning", icon: "⚠️", messageEn: "Contains milk / lactose" });
  }
  if (profile.diet_mode === "weight_loss" && (product.calories_100g ?? 0) > 400) {
    warnings.push({
      level: "info",
      icon: "ℹ️",
      messageEn: `High calorie: ${product.calories_100g} kcal per 100g`,
    });
  }
  if (product.nova_group === 4) {
    warnings.push({ level: "info", icon: "ℹ️", messageEn: "Ultra-processed food (NOVA 4)" });
  }
  return warnings;
}

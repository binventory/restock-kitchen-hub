import type { ResolvedProduct } from "@/lib/types/product";

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-500 text-white",
  B: "bg-lime-500 text-white",
  C: "bg-yellow-500 text-white",
  D: "bg-orange-500 text-white",
  E: "bg-red-500 text-white",
};

const NOVA_COLORS: Record<number, string> = {
  1: "bg-green-500",
  2: "bg-yellow-500",
  3: "bg-orange-500",
  4: "bg-red-500",
};

export function ProductNutriscoreCard({ product }: { product: ResolvedProduct }) {
  const { nutriscore, nova_group, ecoscore } = product;

  // Build list of "why this grade" reasons from nutrition data
  const reasons: string[] = [];
  if (product.sugars_100g != null && product.sugars_100g > 20) {
    reasons.push(`High sugar: ${product.sugars_100g}g per 100g`);
  }
  if (product.saturated_fat_100g != null && product.saturated_fat_100g > 5) {
    reasons.push(`High saturated fat: ${product.saturated_fat_100g}g per 100g`);
  }
  if (product.salt_100g != null && product.salt_100g > 1.5) {
    reasons.push(`High salt: ${product.salt_100g}g per 100g`);
  }
  if (product.calories_100g != null && product.calories_100g > 400) {
    reasons.push(`High calories: ${product.calories_100g} kcal per 100g`);
  }
  if (product.fiber_100g === 0 || product.fiber_100g == null) {
    if (product.calories_100g != null && product.calories_100g > 50) {
      reasons.push("Low or no fiber");
    }
  }

  // If we have absolutely nothing useful, hide the whole card
  if (!nutriscore && !nova_group && !ecoscore && reasons.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-semibold">Nutrition score</p>
        <div className="flex items-center gap-2 flex-wrap">
          {nutriscore ? (
            <div className={`h-9 w-9 grid place-items-center rounded-md font-bold text-lg ${GRADE_COLORS[nutriscore]}`}>
              {nutriscore}
            </div>
          ) : (
            <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Nutri-score not available</span>
          )}
          {nova_group && (
            <div
              className={`h-9 w-9 grid place-items-center rounded-full text-white font-bold text-sm ${NOVA_COLORS[nova_group]}`}
              title="NOVA processing group"
            >
              {nova_group}
            </div>
          )}
          {ecoscore && (
            <div className="h-9 px-2 grid place-items-center rounded-md font-bold text-sm bg-emerald-600 text-white">
              Eco {ecoscore}
            </div>
          )}
        </div>
      </div>

      {!nutriscore && reasons.length === 0 && (
        <p className="text-xs text-muted-foreground">
          OpenFoodFacts does not have enough data to compute a Nutri-score for this product. The packaging may still
          show one.
        </p>
      )}

      {reasons.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Highlights from the nutrition data:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5 ms-4 list-disc">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

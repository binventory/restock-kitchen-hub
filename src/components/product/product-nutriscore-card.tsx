import type { ResolvedProduct, Grade } from "@/lib/types/product";

const COLORS: Record<string, string> = {
  A: "bg-green-500 text-white",
  B: "bg-green-300 text-black",
  C: "bg-yellow-300 text-black",
  D: "bg-orange-400 text-white",
  E: "bg-red-500 text-white",
};

function badgeColor(g: Grade) {
  return g ? COLORS[g] : "bg-muted text-muted-foreground";
}

export function ProductNutriscoreCard({ product }: { product: ResolvedProduct }) {
  const issues: string[] = [];
  if ((product.sugars_100g ?? 0) > 20) issues.push(`Very high sugars: ${product.sugars_100g}g per 100g`);
  if ((product.saturated_fat_100g ?? 0) > 5)
    issues.push(`High saturated fat: ${product.saturated_fat_100g}g per 100g`);
  if ((product.calories_100g ?? 0) > 400)
    issues.push(`High calories: ${product.calories_100g} kcal per 100g`);
  if (!product.fiber_100g) issues.push("No fiber");

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div
          className={`h-14 w-14 rounded-lg grid place-items-center font-bold text-2xl ${badgeColor(product.nutriscore)}`}
        >
          {product.nutriscore ?? "?"}
        </div>
        <div>
          <p className="text-sm font-semibold">Nutri-Score: {product.nutriscore ?? "Unknown"}</p>
          {product.nova_group && (
            <p className="text-xs text-muted-foreground">NOVA group: {product.nova_group}</p>
          )}
        </div>
      </div>
      {issues.length > 0 && (
        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
          {issues.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

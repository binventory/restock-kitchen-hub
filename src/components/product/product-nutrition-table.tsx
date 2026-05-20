import type { ResolvedProduct } from "@/lib/types/product";

const ROWS: { key: keyof ResolvedProduct; label: string; unit: string }[] = [
  { key: "calories_100g", label: "Energy", unit: "kcal" },
  { key: "fat_100g", label: "Fat", unit: "g" },
  { key: "saturated_fat_100g", label: "  of which saturated", unit: "g" },
  { key: "carbohydrates_100g", label: "Carbohydrates", unit: "g" },
  { key: "sugars_100g", label: "  of which sugars", unit: "g" },
  { key: "proteins_100g", label: "Protein", unit: "g" },
  { key: "salt_100g", label: "Salt", unit: "g" },
  { key: "fiber_100g", label: "Fibre", unit: "g" },
];

export function ProductNutritionTable({ product }: { product: ResolvedProduct }) {
  const hasAny = ROWS.some((r) => product[r.key] !== null && product[r.key] !== undefined);
  if (!hasAny) return null;

  const servingRatio =
    product.serving_size_g && product.serving_size_g > 0 ? product.serving_size_g / 100 : null;

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted text-xs">
          <tr>
            <th className="text-start p-2">Nutrient</th>
            <th className="text-end p-2">Per 100g</th>
            <th className="text-end p-2">Per serving</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => {
            const v = product[r.key] as number | null;
            const lvl = product.nutrient_levels?.[r.key.replace("_100g", "")];
            return (
              <tr key={r.key} className="border-t">
                <td className="p-2">{r.label}</td>
                <td className={`p-2 text-end ${lvl === "high" ? "text-red-600 font-semibold" : ""}`}>
                  {v !== null ? `${v} ${r.unit}` : "—"}
                </td>
                <td className="p-2 text-end text-muted-foreground">
                  {v !== null && servingRatio !== null
                    ? `${(v * servingRatio).toFixed(1)} ${r.unit}`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

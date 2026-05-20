import type { ResolvedProduct } from "@/lib/types/product";

export function ProductAllergensSection({ product }: { product: ResolvedProduct }) {
  if (product.allergens.length === 0 && product.traces_allergens.length === 0) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-sm font-semibold mb-1">Allergens</p>
        <p className="text-sm text-muted-foreground">No major allergens listed</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <p className="text-sm font-semibold">Allergens</p>
      {product.allergens.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Contains:</p>
          <div className="flex flex-wrap gap-1">
            {product.allergens.map((a) => (
              <span key={a} className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-2 py-1 rounded capitalize">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
      {product.traces_allergens.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">May contain:</p>
          <div className="flex flex-wrap gap-1">
            {product.traces_allergens.map((a) => (
              <span key={a} className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 px-2 py-1 rounded capitalize">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

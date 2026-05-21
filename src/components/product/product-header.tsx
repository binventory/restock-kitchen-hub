import type { ResolvedProduct } from "@/lib/types/product";

export function ProductHeader({ product }: { product: ResolvedProduct }) {
  const badge =
    product.type === "global"
      ? {
          text: "🌍 Global database",
          color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
        }
      : product.type === "rejected"
        ? {
            text: "🏠 Your household",
            color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
          }
        : {
            text: "⏳ Pending review",
            color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
          };

  return (
    <div className="flex flex-col items-center text-center">
      {/* Picture */}
      <div className="h-40 w-40 rounded-xl bg-muted overflow-hidden">
        {product.image_url && <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />}
      </div>

      {/* Name */}
      <h2 className="text-xl font-bold mt-3">{product.name}</h2>
      {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
      {product.quantity_value && (
        <p className="text-sm text-muted-foreground">
          {product.quantity_value}
          {product.quantity_unit ?? "g"}
        </p>
      )}
      {product.barcode && <p className="text-xs text-muted-foreground font-mono mt-1">{product.barcode}</p>}

      {/* Supermarkt — where to find it */}
      {product.available_stores.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-1">Available at</p>
          <div className="flex flex-wrap justify-center gap-1">
            {product.available_stores.slice(0, 4).map((s) => (
              <span key={s} className="text-xs bg-muted px-2 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Database — source badge */}
      <span className={`text-xs px-2 py-1 rounded mt-3 ${badge.color}`}>{badge.text}</span>
    </div>
  );
}

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ItemCard } from "./item-card";
import type { InventoryItem } from "@/lib/services/inventory-service";
import type { ResolvedProduct } from "@/lib/types/product";

interface Props {
  items: InventoryItem[];
  onSelect: (p: ResolvedProduct) => void;
  onDeleted?: () => void;
}

export function InventoryMergedRow({ items, onSelect, onDeleted }: Props) {
  const [open, setOpen] = useState(false);

  const totalQty = items.reduce((sum, it) => sum + Number(it.quantity), 0);
  const lowestLimit = Math.min(
    ...items.map((it) => Number(it.limit_threshold)),
  );
  const isLow = totalQty <= lowestLimit;
  const first = items[0];
  const baseName = first.product?.name ?? "—";

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent/30"
      >
        <div className="relative h-12 w-12 shrink-0">
          {first.product?.image_url ? (
            <img
              src={first.product.image_url}
              alt={baseName}
              className="h-12 w-12 rounded-md object-cover bg-muted"
            />
          ) : (
            <div className="h-12 w-12 rounded-md bg-muted" />
          )}
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
            {items.length}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{baseName}</p>
          <p className="text-xs text-muted-foreground">
            {items.length} brands · total {totalQty}
          </p>
        </div>
        {isLow && (
          <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-600">
            Low
          </span>
        )}
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="space-y-2 border-t bg-muted/20 p-2">
          {items.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              onSelect={onSelect}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

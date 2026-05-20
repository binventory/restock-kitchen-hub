import { useState, useRef } from "react";
import { Minus, Plus } from "lucide-react";
import type { InventoryItem } from "@/lib/services/inventory-service";
import { updateQuantity } from "@/lib/services/inventory-service";
import { itemToResolved } from "./item-to-resolved";
import type { ResolvedProduct } from "@/lib/types/product";

interface Props {
  item: InventoryItem;
  onSelect: (p: ResolvedProduct) => void;
}

export function ItemCard({ item, onSelect }: Props) {
  const [qty, setQty] = useState(item.quantity);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const change = (delta: number) => {
    const next = Math.max(0, qty + delta);
    setQty(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void updateQuantity(item.id, next), 500);
  };

  const isOut = qty === 0;
  const isLow = qty > 0 && qty <= item.limit_threshold;

  return (
    <div
      onClick={() => onSelect(itemToResolved(item))}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 cursor-pointer hover:bg-accent/30"
    >
      <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
        {item.product?.image_url && (
          <img src={item.product.image_url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-sm">{item.product?.name ?? "—"}</p>
        {item.product?.brand && (
          <p className="text-xs text-muted-foreground truncate">{item.product.brand}</p>
        )}
        <div className="flex gap-1 mt-1">
          {isOut && (
            <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-1.5 py-0.5 rounded">
              Out
            </span>
          )}
          {isLow && (
            <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 px-1.5 py-0.5 rounded">
              Low
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => change(-1)}
          className="h-8 w-8 grid place-items-center rounded-full bg-muted hover:bg-muted-foreground/20"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="min-w-[2ch] text-center text-sm font-medium">{qty}</span>
        <button
          onClick={() => change(1)}
          className="h-8 w-8 grid place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

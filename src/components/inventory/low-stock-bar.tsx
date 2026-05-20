import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { getLowStockItems, type InventoryItem } from "@/lib/services/inventory-service";
import { addShoppingItem } from "@/lib/services/shopping-service";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { itemToResolved } from "./item-to-resolved";
import type { ResolvedProduct } from "@/lib/types/product";

interface Props {
  householdId: string;
  onSelectProduct: (p: ResolvedProduct) => void;
}

export function LowStockBar({ householdId, onSelectProduct }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void getLowStockItems(householdId).then(setItems);
  }, [householdId]);

  if (items.length === 0) return null;

  const addAll = async () => {
    if (!user) return;
    for (const it of items) {
      if (!it.product) continue;
      await addShoppingItem({
        household_id: householdId,
        added_by: user.id,
        product_id: it.product_id ?? undefined,
        user_product_id: it.user_product_id ?? undefined,
        needed_quantity: Math.max(1, it.limit_threshold - it.quantity || 1),
      });
    }
    toast.success("Added to shopping list");
  };

  return (
    <div className="rounded-xl border-2 border-orange-400 bg-orange-50 dark:bg-orange-950/30 p-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          {items.length} items running low
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => it.product && onSelectProduct(itemToResolved(it))}
              className="flex w-full items-center justify-between text-sm hover:underline"
            >
              <span>{it.product?.name ?? "—"}</span>
              <span className="text-muted-foreground">
                {it.quantity}/{it.limit_threshold}
              </span>
            </button>
          ))}
          <Button onClick={addAll} size="sm" className="w-full mt-2">
            Add all to shopping list
          </Button>
        </div>
      )}
    </div>
  );
}

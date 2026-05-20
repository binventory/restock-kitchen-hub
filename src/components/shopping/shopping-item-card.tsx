import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import type { ShoppingItem } from "@/lib/services/shopping-service";

interface Props {
  item: ShoppingItem;
  onCheck: (item: ShoppingItem, checked: boolean, bought: number) => void;
  onDelete: (id: string) => void;
}

export function ShoppingItemCard({ item, onCheck, onDelete }: Props) {
  const [bought, setBought] = useState(item.needed_quantity);
  const name = item.product?.name ?? item.custom_text ?? "—";
  const sub = item.product?.brand ?? null;
  const img = item.custom_image_url ?? item.product?.image_url ?? null;

  return (
    <div className="flex gap-3 items-start rounded-xl border bg-card p-3">
      <input
        type="checkbox"
        checked={item.is_checked}
        onChange={(e) => onCheck(item, e.target.checked, bought)}
        className="h-5 w-5 mt-1"
      />
      <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0 grid place-items-center">
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-muted-foreground">{name[0]}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{name}</p>
        {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        {item.item_note && (
          <p className="text-xs text-green-700 dark:text-green-400 truncate">📝 {item.item_note}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-muted px-2 py-0.5 rounded">Need {item.needed_quantity}</span>
          {item.added_automatically && (
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">Auto</span>
          )}
          {!item.is_checked && (
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              Bought:
              <Input
                type="number"
                min="0"
                value={bought}
                onChange={(e) => setBought(+e.target.value)}
                className="h-6 w-14 text-xs"
              />
            </label>
          )}
        </div>
      </div>
      <button onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

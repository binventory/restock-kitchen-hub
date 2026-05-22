import { useState, useRef } from "react";
import { Trash2, Minus, Plus } from "lucide-react";
import type { ShoppingItem } from "@/lib/services/shopping-service";
import { fetchFullProduct } from "@/lib/services/inventory-service";
import type { ResolvedProduct } from "@/lib/types/product";

interface Props {
  item: ShoppingItem;
  onCheck: (item: ShoppingItem, checked: boolean, bought: number) => void;
  onDelete: (id: string) => void;
  onSelect?: (p: ResolvedProduct) => void;
  onChangeNeeded?: (item: ShoppingItem, newQty: number) => void;
}

const SWIPE_THRESHOLD = 80;

export function ShoppingItemCard({ item, onCheck, onDelete, onSelect, onChangeNeeded }: Props) {
  const [offset, setOffset] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const startX = useRef(0);
  const swiping = useRef(false);

  const name = item.product?.name ?? item.custom_text ?? "—";
  const sub = item.product?.brand ?? null;
  const img = item.custom_image_url ?? item.product?.image_url ?? null;

  const openProduct = async () => {
    if (offset !== 0) return;
    if (!onSelect) return;
    // Custom items have no DB product to open
    if (!item.product_id && !item.user_product_id) return;
    const full = await fetchFullProduct(item.product_id, item.user_product_id);
    if (full) onSelect(full);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    swiping.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!swiping.current) return;
    const dx = e.touches[0].clientX - startX.current;
    setOffset(Math.min(0, Math.max(-120, dx)));
  };
  const onTouchEnd = () => {
    swiping.current = false;
    if (offset <= -SWIPE_THRESHOLD) {
      setOffset(-120);
      setConfirming(true);
    } else {
      setOffset(0);
    }
  };

  const confirmDelete = () => {
    onDelete(item.id);
    setConfirming(false);
  };

  const cancelDelete = () => {
    setOffset(0);
    setConfirming(false);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Red delete background revealed by swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 px-4 gap-2">
        {confirming ? (
          <>
            <button onClick={cancelDelete} className="text-xs text-white bg-black/30 px-2 py-1 rounded">
              Cancel
            </button>
            <button onClick={confirmDelete} className="text-xs text-white bg-white/20 px-2 py-1 rounded font-semibold">
              Delete
            </button>
          </>
        ) : (
          <Trash2 className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Foreground card */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${offset}px)` }}
        className="flex gap-3 items-start rounded-xl border bg-card p-3 transition-transform"
      >
        <input
          type="checkbox"
          checked={item.is_checked}
          onChange={(e) => onCheck(item, e.target.checked, item.needed_quantity)}
          className="h-5 w-5 mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        <div
          className="h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0 grid place-items-center cursor-pointer"
          onClick={() => void openProduct()}
        >
          {img ? (
            <img src={img} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-muted-foreground">{name[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => void openProduct()}>
          <p className="font-medium text-sm truncate">{name}</p>
          {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
          <div className="flex gap-1 mt-0.5">
            {item.product_id ? (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                Global Database
              </span>
            ) : item.user_product_id ? (
              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                User Item
              </span>
            ) : item.custom_text ? (
              <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
                Custom
              </span>
            ) : null}
          </div>
          {item.item_note && <p className="text-xs text-green-700 dark:text-green-400 truncate">📝 {item.item_note}</p>}
          <div className="flex items-center gap-2 mt-1">
            {onChangeNeeded ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onChangeNeeded(item, Math.max(0, item.needed_quantity - 1))}
                  className="h-7 w-7 grid place-items-center rounded-full bg-muted hover:bg-muted-foreground/20"
                  aria-label="Decrease needed quantity"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-[2ch] text-center text-xs font-medium">{item.needed_quantity}</span>
                <button
                  onClick={() => onChangeNeeded(item, item.needed_quantity + 1)}
                  className="h-7 w-7 grid place-items-center rounded-full bg-primary text-primary-foreground"
                  aria-label="Increase needed quantity"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <span className="text-xs bg-muted px-2 py-0.5 rounded">Need {item.needed_quantity}</span>
            )}
            {item.added_automatically && (
              <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded">
                Auto
              </span>
            )}
          </div>
        </div>
        <Input
          type="number"
          value={bought}
          min={0}
          onChange={(e) => setBought(Math.max(0, Number(e.target.value)))}
          className="w-16 h-9 text-sm"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

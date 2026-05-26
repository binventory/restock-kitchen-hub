import { useState, useRef } from "react";
import { Trash2, Minus, Plus, Check } from "lucide-react";
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
  const img = item.custom_image_url ?? item.product?.image_url ?? null;
  const supermarket =
    (item.product as { available_stores?: string[] } | null)?.available_stores?.[0] ?? null;
  const note = item.item_note;
  const neededQty = item.needed_quantity;

  const openProduct = async () => {
    if (offset !== 0) return;
    if (!onSelect) return;
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

  const handleQty = (n: number) => {
    if (onChangeNeeded) onChangeNeeded(item, Math.max(1, n));
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
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

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${offset}px)` }}
        className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-transform"
      >
        {/* LEFT: image + info */}
        <div className="flex flex-1 min-w-0 items-center gap-3 cursor-pointer" onClick={() => void openProduct()}>
          <div className="h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden grid place-items-center">
            {img ? (
              <img src={img} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">{name[0]}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{name}</p>
            {supermarket && (
              <p className="text-xs text-muted-foreground truncate">📍 {supermarket}</p>
            )}
            {note && (
              <p className="text-xs text-green-700 dark:text-green-400 truncate">📝 {note}</p>
            )}
            {item.added_automatically && (
              <span className="inline-block mt-0.5 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded">
                Auto
              </span>
            )}
          </div>
        </div>

        {/* RIGHT: quantity controls + check */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onChangeNeeded && (
            <>
              <button
                onClick={() => handleQty(neededQty - 1)}
                className="h-8 w-8 grid place-items-center rounded-full bg-muted hover:bg-muted-foreground/20"
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[2ch] text-center text-sm font-semibold">{neededQty}</span>
              <button
                onClick={() => handleQty(neededQty + 1)}
                className="h-8 w-8 grid place-items-center rounded-full bg-muted hover:bg-muted-foreground/20"
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={() => onCheck(item, !item.is_checked, neededQty)}
            className={`ml-1 h-9 w-9 grid place-items-center rounded-full ${
              item.is_checked
                ? "bg-primary text-primary-foreground"
                : "border-2 border-primary text-primary"
            }`}
            aria-label={item.is_checked ? "Uncheck" : "Check off"}
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { InventoryItem } from "@/lib/services/inventory-service";
import { updateQuantity, removeFromInventory, fetchFullProduct } from "@/lib/services/inventory-service";
import type { ResolvedProduct } from "@/lib/types/product";

interface Props {
  item: InventoryItem;
  onSelect: (p: ResolvedProduct) => void;
  onDeleted?: () => void;
}

const SWIPE_THRESHOLD = 80;

export function ItemCard({ item, onSelect, onDeleted }: Props) {
  const [qty, setQty] = useState(item.quantity);
  const [offset, setOffset] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startX = useRef(0);
  const swiping = useRef(false);

  const change = (delta: number) => {
    const next = Math.max(0, qty + delta);
    setQty(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void updateQuantity(item.id, next), 500);
  };

  const openProduct = async () => {
    if (offset !== 0) return;
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

  const confirmDelete = async () => {
    await removeFromInventory(item.id);
    setConfirming(false);
    onDeleted?.();
  };

  const cancelDelete = () => {
    setOffset(0);
    setConfirming(false);
  };

  const isOut = qty === 0;
  const isLow = qty > 0 && qty <= item.limit_threshold;
  const badge = isOut
    ? { text: "RESTOCK", className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" }
    : isLow
      ? { text: `Qty: ${qty}`, className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" }
      : { text: `Qty: ${qty}`, className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Red delete background revealed by swipe */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 px-4 gap-2">
        {confirming ? (
          <>
            <button onClick={cancelDelete} className="text-xs text-white bg-black/30 px-2 py-1 rounded">
              Cancel
            </button>
            <button
              onClick={() => void confirmDelete()}
              className="text-xs text-white bg-white/20 px-2 py-1 rounded font-semibold"
            >
              Delete
            </button>
          </>
        ) : (
          <Trash2 className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Foreground card */}
      <div
        onClick={() => void openProduct()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${offset}px)` }}
        className="flex items-center gap-3 rounded-xl border bg-card p-3 cursor-pointer hover:bg-accent/30 transition-transform"
      >
        <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
          {item.product?.image_url && (
            <img src={item.product.image_url} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate text-sm">{item.product?.name ?? "—"}</p>
          {item.product?.brand && <p className="text-xs text-muted-foreground truncate">{item.product.brand}</p>}
          <div className="flex gap-1 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${badge.className}`}>
              {badge.text}
            </span>
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
    </div>
  );
}

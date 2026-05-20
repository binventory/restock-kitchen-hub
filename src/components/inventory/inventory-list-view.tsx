import { useRef, useEffect } from "react";
import { ItemCard } from "./item-card";
import type { InventoryItem } from "@/lib/services/inventory-service";
import type { ResolvedProduct } from "@/lib/types/product";

interface Props {
  items: InventoryItem[];
  onLoadMore?: () => void;
  onSelect: (p: ResolvedProduct) => void;
}

export function InventoryListView({ items, onLoadMore, onSelect }: Props) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onLoadMore || !sentinel.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) onLoadMore();
    });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [onLoadMore]);

  return (
    <div className="space-y-2">
      {items.map((it) => (
        <ItemCard key={it.id} item={it} onSelect={onSelect} />
      ))}
      {onLoadMore && <div ref={sentinel} className="h-4" />}
    </div>
  );
}

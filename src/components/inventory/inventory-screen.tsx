import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { supabase } from "@/integrations/supabase/client";
import { getInventory, type InventoryItem } from "@/lib/services/inventory-service";
import { LowStockBar } from "./low-stock-bar";
import { InventoryControls } from "./inventory-controls";
import { InventoryListView } from "./inventory-list-view";
import { InventoryGroupedView } from "./inventory-grouped-view";
import { ProductPage } from "@/components/product/product-page";
import type { ResolvedProduct } from "@/lib/types/product";

const PAGE_SIZE = 20;

export function InventoryScreen() {
  const { current } = useHousehold();
  const { t } = useTranslation();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "qty_asc" | "low_first">("name");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [view, setView] = useState<"list" | "grouped">("list");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ResolvedProduct | null>(null);

  const load = useCallback(
    async (reset = true) => {
      if (!current) return;
      setLoading(true);

      const currentOffset = reset ? 0 : offset;

      const data = await getInventory(current.id, {
        limit: PAGE_SIZE,
        offset: currentOffset,
        search,
        sort,
        filter,
      });

      setItems((prev) => {
        if (reset) return data;
        const combined = [...prev, ...data];
        const uniqueMap = new Map(combined.map((item) => [item.id, item]));
        return Array.from(uniqueMap.values());
      });

      setHasMore(data.length === PAGE_SIZE);
      setOffset(currentOffset + PAGE_SIZE);
      setLoading(false);
    },
    [current, search, sort, filter, offset],
  );

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, search, sort, filter]);

  useEffect(() => {
    if (!current) return;
    const ch = supabase
      .channel(`household:${current.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory",
          filter: `household_id=eq.${current.id}`,
        },
        () => void load(true),
      )
      .subscribe();
    const onVis = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      void supabase.removeChannel(ch);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  if (!current) return null;
  const empty = !loading && items.length === 0 && !search && filter === "all";

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t("inventory.title")}</h1>
      <LowStockBar householdId={current.id} onSelectProduct={setSelectedProduct} />
      <InventoryControls
        search={search}
        onSearch={setSearch}
        sort={sort}
        onSort={setSort}
        filter={filter}
        onFilter={setFilter}
        view={view}
        onView={setView}
      />
      {empty ? (
        <div className="mt-12 rounded-xl border border-dashed p-10 text-center">
          <p className="text-lg font-semibold">{t("inventory.emptyTitle")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("inventory.emptyHint")}</p>
          <p className="mt-6 text-3xl">↘️</p>
        </div>
      ) : view === "list" ? (
        <InventoryListView
          items={items}
          onLoadMore={hasMore ? () => void load(false) : undefined}
          onSelect={setSelectedProduct}
          onDeleted={() => void load(true)}
        />
      ) : (
        <InventoryGroupedView items={items} onSelect={setSelectedProduct} onDeleted={() => void load(true)} />
      )}
      {selectedProduct && <ProductPage product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}

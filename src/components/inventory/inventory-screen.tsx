import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { supabase } from "@/integrations/supabase/client";
import { getInventory } from "@/lib/services/inventory-service";
import { qk } from "@/lib/query-keys";
import { LowStockBar } from "./low-stock-bar";
import { InventoryControls } from "./inventory-controls";
import { InventoryListView } from "./inventory-list-view";
import { InventoryGroupedView } from "./inventory-grouped-view";
import { ProductPage } from "@/components/product/product-page";
import { LivePill } from "@/components/ui/live-pill";
import type { ResolvedProduct } from "@/lib/types/product";

const PAGE_SIZE = 20;

export function InventoryScreen() {
  const { current } = useHousehold();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "qty_asc" | "low_first">("name");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [view, setView] = useState<"list" | "grouped">("list");
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [selectedProduct, setSelectedProduct] = useState<ResolvedProduct | null>(null);

  // Reset pagination when filters change
  useEffect(() => {
    setPageSize(PAGE_SIZE);
  }, [search, sort, filter, current?.id]);

  const params = { search, sort, filter, pageSize };
  const { data: items = [], isLoading } = useQuery({
    queryKey: current ? qk.inventoryList(current.id, params) : ["inventory-noop"],
    queryFn: () =>
      getInventory(current!.id, { limit: pageSize, offset: 0, search, sort, filter }),
    enabled: !!current,
  });

  const hasMore = items.length === pageSize;

  // Realtime: invalidate all inventory queries for this household on any change
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
        () => {
          void qc.invalidateQueries({ queryKey: qk.inventory(current.id) });
        },
      )
      .subscribe();
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void qc.invalidateQueries({ queryKey: qk.inventory(current.id) });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      void supabase.removeChannel(ch);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [current, qc]);

  if (!current) return null;
  const empty = !isLoading && items.length === 0 && !search && filter === "all";
  const invalidate = () => void qc.invalidateQueries({ queryKey: qk.inventory(current.id) });

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-4xl sm:text-5xl tracking-tight leading-none">
            <span className="font-semibold">{t("inventory.title")}</span>{" "}
            <span className="font-display italic text-primary">
              {t("inventory.titleAccent", { defaultValue: "" })}
            </span>
          </h1>
          <LivePill />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("inventory.lastSyncedLabel", { defaultValue: "" })}
        </p>
      </div>
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
          onLoadMore={hasMore ? () => setPageSize((p) => p + PAGE_SIZE) : undefined}
          onSelect={setSelectedProduct}
          onDeleted={invalidate}
        />
      ) : (
        <InventoryGroupedView items={items} onSelect={setSelectedProduct} onDeleted={invalidate} />
      )}
      {selectedProduct && <ProductPage product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}

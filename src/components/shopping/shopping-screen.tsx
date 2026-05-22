import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { useHousehold } from "@/contexts/HouseholdProvider";
import {
  getShoppingList,
  setChecked,
  clearChecked,
  deleteShoppingItem,
  type ShoppingItem,
} from "@/lib/services/shopping-service";
import { updateQuantity, addToInventory } from "@/lib/services/inventory-service";
import { updateShoppingListQuantity } from "@/lib/services/shopping-list-service";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingItemCard } from "./shopping-item-card";
import { AddItemModal } from "./add-item-modal";
import { ProductPage } from "@/components/product/product-page";
import type { ResolvedProduct } from "@/lib/types/product";

const cacheKey = (hid: string) => `restock_shopping_${hid}`;

export function ShoppingScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { current } = useHousehold();
  const qc = useQueryClient();
  const [showDone, setShowDone] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [selectedProduct, setSelectedProduct] = useState<ResolvedProduct | null>(null);

  const { data: items = [] } = useQuery<ShoppingItem[]>({
    queryKey: current ? qk.shopping(current.id) : ["shopping-noop"],
    queryFn: async () => {
      if (!navigator.onLine) {
        const cached = localStorage.getItem(cacheKey(current!.id));
        return cached ? (JSON.parse(cached) as ShoppingItem[]) : [];
      }
      const data = await getShoppingList(current!.id);
      localStorage.setItem(cacheKey(current!.id), JSON.stringify(data));
      return data;
    },
    enabled: !!current,
  });

  const invalidate = () => {
    if (current) void qc.invalidateQueries({ queryKey: qk.shopping(current.id) });
  };

  useEffect(() => {
    const on = () => {
      setOnline(true);
      invalidate();
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    if (!current) return;
    const ch = supabase
      .channel(`shopping:${current.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_list",
          filter: `household_id=eq.${current.id}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: qk.shopping(current.id) });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [current, qc]);

  const onCheck = async (item: ShoppingItem, checked: boolean, bought: number) => {
    if (checked) {
      await setChecked(item, true, bought);
      if (item.product_id || item.user_product_id) {
        const col = item.product_id ? "product_id" : "user_product_id";
        const refId = (item.product_id ?? item.user_product_id)!;
        const { data: inv } = await supabase
          .from("inventory")
          .select("id, quantity")
          .eq("household_id", item.household_id)
          .eq(col, refId)
          .maybeSingle();
        if (inv) await updateQuantity(inv.id, Number(inv.quantity) + bought);
        else
          await addToInventory(
            item.household_id,
            item.product_id ? { product_id: refId } : { user_product_id: refId },
            bought,
            1,
            "pieces",
            item.product?.name,
          );
        void qc.invalidateQueries({ queryKey: qk.inventory(item.household_id) });
      }
      toast.success("✅ Added to stock");
    } else {
      if (confirm("Did you put it back on the shelf? OK = reverse stock; Cancel = just uncheck")) {
        if (item.product_id || item.user_product_id) {
          const col = item.product_id ? "product_id" : "user_product_id";
          const refId = (item.product_id ?? item.user_product_id)!;
          const { data: inv } = await supabase
            .from("inventory")
            .select("id, quantity")
            .eq("household_id", item.household_id)
            .eq(col, refId)
            .maybeSingle();
          if (inv) await updateQuantity(inv.id, Math.max(0, Number(inv.quantity) - item.bought_quantity));
          void qc.invalidateQueries({ queryKey: qk.inventory(item.household_id) });
        }
      }
      await setChecked(item, false);
    }
    invalidate();
  };

  const onDelete = async (id: string) => {
    await deleteShoppingItem(id);
    invalidate();
  };

  const onChangeNeeded = async (item: ShoppingItem, newQty: number) => {
    // Optimistic update via cache
    if (current) {
      qc.setQueryData<ShoppingItem[]>(qk.shopping(current.id), (prev) =>
        !prev
          ? prev
          : newQty <= 0
            ? prev.filter((p) => p.id !== item.id)
            : prev.map((p) => (p.id === item.id ? { ...p, needed_quantity: newQty } : p)),
      );
    }
    await updateShoppingListQuantity(item.id, item.household_id, newQty);
    invalidate();
  };

  if (!current) return null;
  const toBuy = items.filter((i) => !i.is_checked);
  const done = items.filter((i) => i.is_checked);

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t("shopping.title")}</h1>
      {!online && <div className="rounded-lg bg-orange-100 dark:bg-orange-950/30 px-3 py-2 text-sm">📴 Offline</div>}
      <section>
        <p className="text-sm font-semibold mb-2">To Buy ({toBuy.length})</p>
        {toBuy.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("shopping.empty")}</p>
        ) : (
          <div className="space-y-2">
            {toBuy.map((i) => (
              <ShoppingItemCard
                key={i.id}
                item={i}
                onCheck={onCheck}
                onDelete={onDelete}
                onSelect={setSelectedProduct}
                onChangeNeeded={onChangeNeeded}
              />
            ))}
          </div>
        )}
      </section>
      {done.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setShowDone(!showDone)} className="text-sm font-semibold flex items-center gap-1">
              <ChevronDown className={`h-4 w-4 transition ${showDone ? "" : "-rotate-90"}`} />
              Done ({done.length})
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await clearChecked(current.id);
                invalidate();
              }}
            >
              Clear done
            </Button>
          </div>
          {showDone && (
            <div className="space-y-2 opacity-60">
              {done.map((i) => (
                <ShoppingItemCard
                  key={i.id}
                  item={i}
                  onCheck={onCheck}
                  onDelete={onDelete}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </section>
      )}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-24 md:bottom-10 start-4 h-14 w-14 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <Plus className="h-6 w-6" />
      </button>
      {addOpen && user && (
        <AddItemModal
          householdId={current.id}
          userId={user.id}
          onClose={() => {
            setAddOpen(false);
            invalidate();
          }}
        />
      )}
      {selectedProduct && <ProductPage product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}

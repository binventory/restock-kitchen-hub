import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ResolvedProduct } from "@/lib/types/product";
import { addToInventory, updateQuantity } from "@/lib/services/inventory-service";
import { suggestLimit } from "@/lib/services/smart-limits-service";
import { qk } from "@/lib/query-keys";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { toast } from "sonner";

interface Props {
  product: ResolvedProduct;
  householdId: string;
}


interface InvRow {
  id: string;
  quantity: number;
  limit_threshold: number;
  unit: string;
}

export function ProductInventoryControls({ product, householdId }: Props) {
  const { households } = useHousehold();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [row, setRow] = useState<InvRow | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [addLimit, setAddLimit] = useState(1);
  const [busy, setBusy] = useState(false);

  const isTempProduct = product.id.startsWith("off_");

  useEffect(() => {
    // Don't query DB with a non-UUID id — Supabase throws on invalid UUIDs.
    if (isTempProduct) {
      const sug = suggestLimit(Math.max(1, households.length), [], product.name);
      setAddLimit(sug);
      return;
    }

    const col = product.tableSource === "products" ? "product_id" : "user_product_id";
    void supabase
      .from("inventory")
      .select("id, quantity, limit_threshold, unit")
      .eq("household_id", householdId)
      .eq(col, product.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRow({
            ...data,
            quantity: Number(data.quantity),
            limit_threshold: Number(data.limit_threshold),
          });
        } else {
          const sug = suggestLimit(Math.max(1, households.length), [], product.name);
          setAddLimit(sug);
        }
      });
  }, [product.id, householdId, households.length, product.name, product.tableSource, isTempProduct]);

  const change = async (d: number) => {
    if (!row || busy) return;
    setBusy(true);
    const n = Math.max(0, row.quantity + d);
    setRow({ ...row, quantity: n });
    await updateQuantity(row.id, n);
    void qc.invalidateQueries({ queryKey: qk.inventory(householdId) });
    void qc.invalidateQueries({ queryKey: qk.shopping(householdId) });
    setBusy(false);
  };

  const add = async () => {
    if (busy || !user) return;
    setBusy(true);

    try {
      let ref: { product_id?: string; user_product_id?: string };

      if (isTempProduct) {
        // Final retry: put the product in the global catalog
        // before giving up and saving as a pending user product.
        const insertRow = {
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          generic_name: product.generic_name,
          category: product.category,
          food_group: product.food_group ?? null,
          image_url: product.image_url,
          quantity_value: product.quantity_value,
          quantity_unit: product.quantity_unit,
          calories_100g: product.calories_100g,
          fat_100g: product.fat_100g,
          saturated_fat_100g: product.saturated_fat_100g,
          carbohydrates_100g: product.carbohydrates_100g,
          sugars_100g: product.sugars_100g,
          proteins_100g: product.proteins_100g,
          salt_100g: product.salt_100g,
          fiber_100g: product.fiber_100g,
          serving_size_g: product.serving_size_g,
          calories_serving: product.calories_serving,
          nutriscore: product.nutriscore,
          ecoscore: product.ecoscore,
          nova_group: product.nova_group,
          nutrient_levels: product.nutrient_levels,
          allergens: product.allergens,
          traces_allergens: product.traces_allergens,
          labels: product.labels,
          is_vegan: product.is_vegan,
          is_vegetarian: product.is_vegetarian,
          is_gluten_free: product.is_gluten_free,
          has_palm_oil: product.has_palm_oil,
          halal_certified: product.halal_certified,
          ingredients_text: product.ingredients_text,
          ingredients_analysis: product.ingredients_analysis,
          available_stores: product.available_stores,
          source: "openfoodfacts" as const,
          is_approved: true,
          submitted_by_user_id: null,
        };

        const { data: globalInsert } = await supabase
          .from("products")
          .insert(insertRow)
          .select("id")
          .single();

        if (globalInsert) {
          ref = { product_id: globalInsert.id };
        } else {
          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("barcode", product.barcode)
            .eq("is_approved", true)
            .maybeSingle();
          if (existing) {
            ref = { product_id: existing.id };
          } else {
            const { data: saved, error: savedErr } = await supabase
              .from("user_products")
              .insert({
                barcode: product.barcode,
                name: product.name,
                brand: product.brand,
                image_url: product.image_url,
                user_id: user.id,
                submission_status: "pending_approval",
              })
              .select("id")
              .single();
            if (savedErr || !saved) {
              toast.error("Could not save product");
              setBusy(false);
              return;
            }
            ref = { user_product_id: saved.id };
          }
        }
      } else {
        ref = product.tableSource === "products" ? { product_id: product.id } : { user_product_id: product.id };
      }

      const id = await addToInventory(householdId, ref, addQty, addLimit, "pieces");
      if (id) {
        setRow({
          id,
          quantity: addQty,
          limit_threshold: addLimit,
          unit: "pieces",
        });
        toast.success("Added to stock");
        void qc.invalidateQueries({ queryKey: qk.inventory(householdId) });
      } else {
        toast.error("Could not add to stock");
      }
    } finally {
      setBusy(false);
    }
  };

  if (row) {
    const isLow = row.quantity <= row.limit_threshold;
    return (
      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-sm font-semibold">In your stock</p>
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={busy}
            onClick={() => void change(-1)}
            className="h-10 w-10 grid place-items-center rounded-full bg-muted disabled:opacity-50"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-2xl font-bold min-w-[3ch] text-center">{row.quantity}</span>
          <button
            disabled={busy}
            onClick={() => void change(1)}
            className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {isLow && <p className="text-xs text-orange-600 text-center">⚠️ Low stock (limit: {row.limit_threshold})</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">
          Quantity
          <Input type="number" min="0" value={addQty} onChange={(e) => setAddQty(+e.target.value)} />
        </label>
        <label className="text-xs">
          Lower limit 💡 {addLimit}
          <Input type="number" min="0" value={addLimit} onChange={(e) => setAddLimit(+e.target.value)} />
        </label>
      </div>
      <Button disabled={busy} onClick={() => void add()} className="w-full">
        {busy ? "Adding..." : "Add to Stock"}
      </Button>
    </div>
  );
}

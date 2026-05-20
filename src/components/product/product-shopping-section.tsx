import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { addShoppingItem, deleteShoppingItem } from "@/lib/services/shopping-service";
import { toast } from "sonner";
import type { ResolvedProduct } from "@/lib/types/product";

interface Props { product: ResolvedProduct; householdId: string; userId: string; }

export function ProductShoppingSection({ product, householdId, userId }: Props) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const col = product.tableSource === "products" ? "product_id" : "user_product_id";
    void supabase
      .from("shopping_list")
      .select("id")
      .eq("household_id", householdId)
      .eq("is_checked", false)
      .eq(col, product.id)
      .maybeSingle()
      .then(({ data }) => setId(data?.id ?? null));
  }, [product.id, product.tableSource, householdId]);

  const add = async () => {
    const ref = product.tableSource === "products"
      ? { product_id: product.id }
      : { user_product_id: product.id };
    await addShoppingItem({ household_id: householdId, added_by: userId, ...ref });
    toast.success("Added to shopping list");
    // re-fetch
    const col = product.tableSource === "products" ? "product_id" : "user_product_id";
    const { data } = await supabase
      .from("shopping_list").select("id").eq("household_id", householdId)
      .eq("is_checked", false).eq(col, product.id).maybeSingle();
    setId(data?.id ?? null);
  };

  const remove = async () => {
    if (!id) return;
    await deleteShoppingItem(id);
    setId(null);
    toast.success("Removed from list");
  };

  return (
    <div className="rounded-xl border p-4">
      {id ? (
        <div className="space-y-2">
          <p className="text-sm">✅ On your shopping list</p>
          <Button variant="outline" onClick={() => void remove()} className="w-full">Remove from list</Button>
        </div>
      ) : (
        <Button onClick={() => void add()} className="w-full">Add to Shopping List</Button>
      )}
    </div>
  );
}

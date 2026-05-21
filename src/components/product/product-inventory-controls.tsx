import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ResolvedProduct } from "@/lib/types/product";
import { addToInventory, updateQuantity } from "@/lib/services/inventory-service";
import { suggestLimit } from "@/lib/services/smart-limits-service";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { toast } from "sonner";

interface Props { product: ResolvedProduct; householdId: string; }

interface InvRow { id: string; quantity: number; limit_threshold: number; unit: string; }

export function ProductInventoryControls({ product, householdId }: Props) {
  const { households } = useHousehold();
  const [row, setRow] = useState<InvRow | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [addLimit, setAddLimit] = useState(1);

  useEffect(() => {
    const col = product.tableSource === "products" ? "product_id" : "user_product_id";
    void supabase
      .from("inventory")
      .select("id, quantity, limit_threshold, unit")
      .eq("household_id", householdId)
      .eq(col, product.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setRow({ ...data, quantity: Number(data.quantity), limit_threshold: Number(data.limit_threshold) });
        else {
          const sug = suggestLimit(Math.max(1, households.length), [], product.name);
          setAddLimit(sug);
        }
      });
  }, [product.id, householdId, households.length, product.name, product.tableSource]);

  const change = async (d: number) => {
    if (!row) return;
    const n = Math.max(0, row.quantity + d);
    setRow({ ...row, quantity: n });
    await updateQuantity(row.id, n);
  };

  const add = async () => {
    const ref = product.tableSource === "products"
      ? { product_id: product.id }
      : { user_product_id: product.id };
    const id = await addToInventory(householdId, ref, addQty, addLimit, "pieces");
    if (id) {
      setRow({ id, quantity: addQty, limit_threshold: addLimit, unit: "pieces" });
      toast.success("Added to stock");
    }
  };

  if (row) {
    const isLow = row.quantity <= row.limit_threshold;
    return (
      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-sm font-semibold">In your stock</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => void change(-1)} className="h-10 w-10 grid place-items-center rounded-full bg-muted">
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-2xl font-bold min-w-[3ch] text-center">{row.quantity}</span>
          <button onClick={() => void change(1)} className="h-10 w-10 grid place-items-center rounded-full bg-primary text-primary-foreground">
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
        <label className="text-xs">Quantity
          <Input type="number" min="0" value={addQty} onChange={(e) => setAddQty(+e.target.value)} />
        </label>
        <label className="text-xs">Lower limit 💡 {addLimit}
          <Input type="number" min="0" value={addLimit} onChange={(e) => setAddLimit(+e.target.value)} />
        </label>
      </div>
      <Button onClick={() => void add()} className="w-full">Add to Stock</Button>
    </div>
  );
}

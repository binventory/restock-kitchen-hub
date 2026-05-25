import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { addToInventory } from "@/lib/services/inventory-service";
import { suggestLimit } from "@/lib/services/smart-limits-service";
import { toast } from "sonner";
import type { ResolvedProduct } from "@/lib/types/product";

interface Props {
  barcode: string;
  onClose: () => void;
  onSaved: (p: ResolvedProduct) => void;
}

interface Group { id: string; name: string; section_id: string | null; keywords: string[]; }

export function AddProductForm({ barcode, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const { current } = useHousehold();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [quantity, setQuantity] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [suggested, setSuggested] = useState<Group | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void supabase
      .from("product_groups")
      .select("id, name, section_id, keywords")
      .then(({ data }) => setGroups(data ?? []));
  }, []);

  useEffect(() => {
    if (!name || groups.length === 0) {
      setSuggested(null);
      return;
    }
    const t = setTimeout(() => {
      const lower = name.toLowerCase();
      const match = groups.find((g) =>
        g.keywords.some((k) => lower.includes(k.toLowerCase())),
      );
      setSuggested(match ?? null);
    }, 300);
    return () => clearTimeout(t);
  }, [name, groups]);

  const save = async () => {
    if (!user || !current || !name.trim()) return;
    setSaving(true);
    const { data: up, error } = await supabase
      .from("user_products")
      .insert({
        barcode,
        name: name.trim(),
        brand: brand.trim() || null,
        user_id: user.id,
        submission_status: "pending_approval",
      })
      .select("*")
      .single();
    if (error || !up) {
      toast.error("Failed to save");
      setSaving(false);
      return;
    }
    const limit = suggestLimit(1, suggested?.keywords ?? [], name);
    await addToInventory(current.id, { user_product_id: up.id }, 0, limit, "pieces");
    toast.success("Product saved! 🎉 Our team will review it.");
    onSaved({
      id: up.id, type: "user", tableSource: "user_products", barcode, name: name.trim(),
      brand: brand.trim() || null, generic_name: null, category: null, food_group: null, image_url: null,
      quantity_value: null, quantity_unit: null, calories_100g: null, fat_100g: null,
      saturated_fat_100g: null, carbohydrates_100g: null, sugars_100g: null, proteins_100g: null,
      salt_100g: null, fiber_100g: null, serving_size_g: null, calories_serving: null,
      nutriscore: null, ecoscore: null, nova_group: null, nutrient_levels: null,
      allergens: [], traces_allergens: [], labels: [], is_vegan: null, is_vegetarian: null,
      is_gluten_free: null, has_palm_oil: null, halal_certified: null, ingredients_text: null,
      ingredients_analysis: [], available_stores: [],
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <h2 className="text-lg font-bold">Add new product</h2>
        <div className="space-y-3">
          <label className="block text-xs">
            Barcode
            <Input value={barcode} readOnly className="bg-muted font-mono" />
          </label>
          <label className="block text-xs">
            Product name *
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
          <label className="block text-xs">
            Brand
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </label>
          <label className="block text-xs">
            Quantity (e.g. 350g)
            <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
          {suggested && (
            <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-2 text-sm">
              📂 Suggested: {suggested.name}
            </div>
          )}
          <Button onClick={() => void save()} disabled={!name.trim() || saving} className="w-full">
            {saving ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

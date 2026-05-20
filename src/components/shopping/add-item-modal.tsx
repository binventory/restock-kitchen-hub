import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { addShoppingItem } from "@/lib/services/shopping-service";
import { toast } from "sonner";
import { CustomItemModal } from "./custom-item-modal";

interface Props { householdId: string; userId: string; onClose: () => void; }

interface SearchResult { id: string; name: string; brand: string | null; }

export function AddItemModal({ householdId, userId, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const doSearch = async (q: string) => {
    setSearch(q);
    if (!q) return setResults([]);
    const { data } = await supabase
      .from("products")
      .select("id, name, brand")
      .eq("is_approved", true)
      .ilike("name", `%${q}%`)
      .limit(10);
    setResults(data ?? []);
  };

  const pick = async (id: string) => {
    await addShoppingItem({ household_id: householdId, added_by: userId, product_id: id });
    toast.success("Added");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <Tabs defaultValue="search">
          <TabsList className="w-full">
            <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Custom item</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="space-y-2">
            <Input value={search} onChange={(e) => void doSearch(e.target.value)} placeholder="Search products..." autoFocus />
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => void pick(r.id)}
                  className="w-full text-start p-2 rounded hover:bg-accent"
                >
                  <p className="text-sm font-medium">{r.name}</p>
                  {r.brand && <p className="text-xs text-muted-foreground">{r.brand}</p>}
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="custom">
            <CustomItemModal householdId={householdId} userId={userId} onSaved={onClose} />
          </TabsContent>
        </Tabs>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </DialogContent>
    </Dialog>
  );
}

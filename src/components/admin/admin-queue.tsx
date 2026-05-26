import { useEffect, useState } from "react";
import { Check, X, Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pending {
  id: string;
  barcode: string | null;
  name: string;
  brand: string | null;
  image_url: string | null;
  created_at: string;
}

interface OffProduct {
  product_name?: string;
  brands?: string;
  image_url?: string;
}

export function AdminQueue() {
  const [list, setList] = useState<Pending[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [offCache, setOffCache] = useState<Record<string, OffProduct | null>>({});

  const load = async () => {
    const { data, error } = await supabase
      .from("user_products")
      .select("id, barcode, name, brand, image_url, created_at")
      .eq("submission_status", "pending_approval")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    setList((data ?? []) as Pending[]);
  };

  useEffect(() => { void load(); }, []);

  const lookupOff = async (barcode: string) => {
    if (offCache[barcode] !== undefined) return;
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const j = await r.json();
      setOffCache((p) => ({ ...p, [barcode]: j?.product ?? null }));
    } catch {
      setOffCache((p) => ({ ...p, [barcode]: null }));
    }
  };

  const act = async (
    id: string,
    fn: "approve_user_product" | "decline_user_product" | "reject_forever_product",
  ) => {
    setBusy(id);
    const { error } = await supabase.rpc(fn, { _id: id });
    if (error) toast.error(error.message);
    else toast.success("Done");
    setBusy(null);
    void load();
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <h1 className="text-2xl font-bold">Submission Queue</h1>
      <p className="text-sm text-muted-foreground">Pending: {list.length}</p>
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground">Nothing to review.</p>
      )}
      {list.map((p) => {
        const off = p.barcode ? offCache[p.barcode] : undefined;
        return (
          <div key={p.id} className="rounded-xl border bg-card p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground">User submission</p>
              {p.image_url && (
                <img src={p.image_url} alt="" className="h-24 w-24 object-contain rounded bg-muted" />
              )}
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.brand}</p>
              <p className="text-xs text-muted-foreground">{p.barcode}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase text-muted-foreground">OpenFoodFacts</p>
                {p.barcode && (
                  <Button size="sm" variant="outline" onClick={() => void lookupOff(p.barcode!)}>
                    Check
                  </Button>
                )}
              </div>
              {off === undefined && (
                <p className="text-xs text-muted-foreground">Click "Check" to compare</p>
              )}
              {off === null && <p className="text-xs text-muted-foreground">Not in OFF</p>}
              {off && (
                <>
                  {off.image_url && (
                    <img src={off.image_url} alt="" className="h-24 w-24 object-contain rounded bg-muted" />
                  )}
                  <p className="font-medium">{off.product_name}</p>
                  <p className="text-sm text-muted-foreground">{off.brands}</p>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2 justify-center">
              <Button onClick={() => void act(p.id, "approve_user_product")} disabled={busy === p.id}>
                {busy === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Approve
              </Button>
              <Button variant="outline" onClick={() => void act(p.id, "decline_user_product")} disabled={busy === p.id}>
                <X className="h-4 w-4" />
                Decline
              </Button>
              <Button variant="destructive" onClick={() => void act(p.id, "reject_forever_product")} disabled={busy === p.id}>
                <Ban className="h-4 w-4" />
                Reject Forever
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

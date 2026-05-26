import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const NUMERIC = [
  "price_monthly", "price_yearly", "max_scanners",
  "max_households", "max_household_members",
  "ai_requests_per_month",
] as const;
const BOOLEAN = [
  "ads_shown", "ai_assistant_enabled", "halal_filter_enabled",
  "health_profile_enabled", "diet_mode_enabled",
  "expiry_alerts_enabled", "price_comparison_enabled",
  "delivery_integration_enabled",
] as const;

type Plan = Record<string, unknown> & { id: string; name: string; slug: string };

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [edits, setEdits] = useState<Record<string, Record<string, unknown>>>({});

  const load = async () => {
    const { data, error } = await supabase.from("plans").select("*").order("display_order");
    if (error) toast.error(error.message);
    setPlans((data ?? []) as Plan[]);
    setEdits({});
  };

  useEffect(() => { void load(); }, []);

  const save = async (id: string) => {
    const patch = edits[id];
    if (!patch) return;
    const { error } = await supabase.from("plans").update(patch as never).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.rpc("log_admin_action", {
      _action: "update_plan",
      _entity_type: "plans",
      _entity_id: id,
      _details: patch as never,
    });
    toast.success("Plan saved");
    void load();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Subscription Plans</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {plans.map((p) => {
          const edit = edits[p.id] ?? {};
          const merged: Record<string, unknown> = { ...p, ...edit };
          const setField = (k: string, v: unknown) =>
            setEdits({ ...edits, [p.id]: { ...edit, [k]: v } });

          return (
            <div key={p.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div>
                <h2 className="font-bold">{p.name}</h2>
                <p className="text-xs text-muted-foreground">{p.slug}</p>
              </div>

              {NUMERIC.map((k) => (
                <div key={k} className="space-y-1">
                  <label className="text-xs text-muted-foreground">{k}</label>
                  <Input
                    type="number"
                    value={Number(merged[k] ?? 0)}
                    onChange={(e) => setField(k, Number(e.target.value))}
                  />
                </div>
              ))}

              {BOOLEAN.map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <label className="text-xs">{k}</label>
                  <Switch
                    checked={Boolean(merged[k])}
                    onCheckedChange={(v) => setField(k, v)}
                  />
                </div>
              ))}

              <Button
                onClick={() => void save(p.id)}
                disabled={!edits[p.id]}
                className="w-full"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

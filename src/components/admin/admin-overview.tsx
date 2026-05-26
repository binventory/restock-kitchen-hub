import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  users: number;
  households: number;
  pending_products: number;
  global_products: number;
  active_subs: number;
  scanners: number;
  ai_requests_month: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void (async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [u, h, pp, gp, s, sc, ai] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("households").select("id", { count: "exact", head: true }),
        supabase.from("user_products").select("id", { count: "exact", head: true }).eq("submission_status", "pending_approval"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_approved", true),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("scanners").select("id", { count: "exact", head: true }),
        supabase.from("ai_usage").select("id", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
      ]);
      setStats({
        users: u.count ?? 0,
        households: h.count ?? 0,
        pending_products: pp.count ?? 0,
        global_products: gp.count ?? 0,
        active_subs: s.count ?? 0,
        scanners: sc.count ?? 0,
        ai_requests_month: ai.count ?? 0,
      });
    })();
  }, []);

  if (!stats) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  const cards = [
    { label: "Users", value: stats.users },
    { label: "Households", value: stats.households },
    { label: "Pending Products", value: stats.pending_products },
    { label: "Global Catalog", value: stats.global_products },
    { label: "Active Subscribers", value: stats.active_subs },
    { label: "Active Scanners", value: stats.scanners },
    { label: "AI Requests This Month", value: stats.ai_requests_month },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="mt-2 text-3xl font-bold">{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

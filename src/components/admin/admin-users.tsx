import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserRow {
  id: string;
  email: string | null;
  created_at: string;
  plan_slug: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<{ slug: string; name: string }[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const [{ data: profiles }, { data: subs }, { data: plansData }] = await Promise.all([
      supabase.from("profiles").select("id, email, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("subscriptions").select("user_id, status, plans(slug)").eq("status", "active"),
      supabase.from("plans").select("slug, name").eq("is_active", true).order("display_order"),
    ]);
    const subBySlug = new Map<string, string>();
    for (const s of (subs ?? []) as Array<{ user_id: string; plans: { slug: string } | null }>) {
      if (s.plans?.slug) subBySlug.set(s.user_id, s.plans.slug);
    }
    setUsers(((profiles ?? []) as Array<{ id: string; email: string | null; created_at: string }>).map((p) => ({
      ...p,
      plan_slug: subBySlug.get(p.id) ?? "free",
    })));
    setPlans((plansData ?? []) as { slug: string; name: string }[]);
  };

  useEffect(() => { void load(); }, []);

  const setPlan = async (userId: string, slug: string) => {
    const { error } = await supabase.rpc("override_user_plan", {
      _user_id: userId,
      _plan_slug: slug,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Plan updated");
      void load();
    }
  };

  const filtered = users.filter((u) =>
    !search || (u.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <h1 className="text-2xl font-bold">Users</h1>
      <Input
        placeholder="Search by email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />
      <div className="rounded-xl border bg-card divide-y">
        {filtered.map((u) => (
          <div key={u.id} className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{u.email ?? u.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString()} · plan: {u.plan_slug}
              </p>
            </div>
            <Select value={u.plan_slug} onValueChange={(v) => void setPlan(u.id, v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No users found.</p>
        )}
      </div>
    </div>
  );
}

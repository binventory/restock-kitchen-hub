import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Restock" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase.rpc("is_admin", { _user_id: user.id }).then(({ data }) => {
      if (!alive) return;
      setState(data ? "allowed" : "denied");
    });
    return () => { alive = false; };
  }, [user]);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl p-6">
        {state === "checking" && <p className="text-sm text-muted-foreground">Checking access…</p>}
        {state === "denied" && (
          <div className="rounded-xl border bg-[var(--bg-elevated)] p-8 text-center">
            <h1 className="text-2xl font-bold">Access denied</h1>
            <p className="mt-2 text-sm text-muted-foreground">You do not have permission to view this page.</p>
          </div>
        )}
        {state === "allowed" && (
          <div className="flex gap-6">
            <aside className="hidden md:block w-56 shrink-0 rounded-xl border bg-[var(--bg-elevated)] p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Admin</p>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                <li>Overview</li>
                <li>Users</li>
                <li>Products</li>
                <li>Orders</li>
                <li>Settings</li>
              </ul>
            </aside>
            <div className="flex-1 rounded-xl border bg-[var(--bg-elevated)] p-8 text-center">
              <h1 className="text-2xl font-bold">Admin Dashboard — Coming Soon</h1>
              <p className="mt-2 text-sm text-muted-foreground">Tools for managing Restock will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

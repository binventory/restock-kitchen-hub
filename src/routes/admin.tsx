import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Restock" }] }),
  beforeLoad: async () => {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const isDevEnv =
      import.meta.env.DEV ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".lovableproject.com"); // preview only
    if (isDevEnv) return;
    const { data, error } = await supabase.rpc("my_admin_status");
    if (error) {
      console.error("[admin guard] my_admin_status error:", error);
      throw redirect({ to: "/" });
    }
    const status = data as { is_admin?: boolean; role?: string | null };
    if (status?.is_admin !== true && status?.role !== "moderator") {
      throw redirect({ to: "/" });
    }
  },
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});

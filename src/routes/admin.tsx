import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Restock" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    const meta = data.user?.app_metadata as Record<string, unknown> | undefined;
    const isAdmin = meta?.is_admin === true;
    const isMod = meta?.role === "moderator";
    if (!isAdmin && !isMod) {
      throw redirect({ to: "/" });
    }
  },
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});

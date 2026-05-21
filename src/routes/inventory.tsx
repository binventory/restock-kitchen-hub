import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { InventoryScreen } from "@/components/inventory/inventory-screen";

export const Route = createFileRoute("/inventory")({
  head: () => ({ meta: [{ title: "Stock — Restock" }] }),
  component: () => (
    <AppShell>
      <InventoryScreen />
    </AppShell>
  ),
});

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ShoppingScreen } from "@/components/shopping/shopping-screen";

export const Route = createFileRoute("/shopping")({
  head: () => ({ meta: [{ title: "Shopping — Restock" }] }),
  component: () => (
    <AppShell>
      <ShoppingScreen />
    </AppShell>
  ),
});

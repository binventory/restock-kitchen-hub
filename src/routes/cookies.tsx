import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Cookies — Restock" }] }),
  component: () => (
    <LegalPage title="Cookie Policy">
      <p>Essential cookies keep Restock functioning. Optional analytics and marketing cookies are off by default.</p>
      <p>Manage your choices anytime from Settings → Privacy.</p>
    </LegalPage>
  ),
});

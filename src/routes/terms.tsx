import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms — Restock" }] }),
  component: () => (
    <LegalPage title="Terms of Service">
      <p>Placeholder terms of service. By using Restock you agree to these terms.</p>
    </LegalPage>
  ),
});

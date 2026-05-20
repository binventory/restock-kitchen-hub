import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/impressum")({
  head: () => ({ meta: [{ title: "Impressum — Restock" }] }),
  component: () => (
    <LegalPage title="Impressum">
      <p>Placeholder Impressum (required by German law).</p>
      <p>Operator name, address, contact email — to be filled in.</p>
    </LegalPage>
  ),
});

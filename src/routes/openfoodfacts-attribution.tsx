import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/layout/LegalPage";

export const Route = createFileRoute("/openfoodfacts-attribution")({
  head: () => ({ meta: [{ title: "OpenFoodFacts attribution — Restock" }] }),
  component: () => (
    <LegalPage title="OpenFoodFacts Attribution">
      <p>
        Product data from <a className="underline" href="https://world.openfoodfacts.org">Open Food Facts</a> under the{" "}
        <a className="underline" href="https://opendatacommons.org/licenses/odbl/1-0/">Open Database License (ODbL)</a>.
      </p>
      <p>Individual contents of the database are available under the Database Contents License.</p>
    </LegalPage>
  ),
});

import { useState } from "react";
import type { ResolvedProduct } from "@/lib/types/product";
import { getHalalStatus } from "@/lib/services/halal-check-service";
import { ChevronDown, ChevronUp } from "lucide-react";

const COLORS = {
  certified: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  halal: "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  unclear: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  haram: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export function ProductHalalSection({ product }: { product: ResolvedProduct }) {
  const [open, setOpen] = useState(false);
  const status = getHalalStatus(product);

  return (
    <div className="rounded-xl border p-4 space-y-2">
      <p className="text-sm font-semibold">Halal status</p>
      <div className={`px-3 py-2 rounded ${COLORS[status.status]}`}>
        <p className="text-sm font-medium">{status.summary}</p>
      </div>
      {status.ingredients.length > 0 && (
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:underline"
        >
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Show ingredient breakdown
        </button>
      )}
      {open && (
        <ul className="text-xs space-y-1">
          {status.ingredients.map((i, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="capitalize font-medium">{i.name}</span>
              <span className="text-muted-foreground">— {i.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

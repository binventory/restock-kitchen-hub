import type { ResolvedProduct, UserHealthProfile } from "@/lib/types/product";
import { getHealthWarnings } from "@/lib/services/health-warnings-service";

const STYLES = {
  danger: "border-red-400 bg-red-50 dark:bg-red-950/30",
  warning: "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
  info: "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
};

interface Props { product: ResolvedProduct; profile: UserHealthProfile; }

export function ProductHealthWarnings({ product, profile }: Props) {
  const warnings = getHealthWarnings(product, profile);
  if (warnings.length === 0) return null;
  return (
    <div className="space-y-2">
      {warnings.map((w, i) => (
        <div key={i} className={`rounded-xl border-2 p-3 text-sm ${STYLES[w.level]}`}>
          <span className="me-2">{w.icon}</span>
          {w.messageEn}
        </div>
      ))}
    </div>
  );
}

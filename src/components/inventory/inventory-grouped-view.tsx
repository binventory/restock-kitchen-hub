import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ItemCard } from "./item-card";
import { InventoryMergedRow } from "./inventory-merged-row";
import type { InventoryItem } from "@/lib/services/inventory-service";
import type { ResolvedProduct } from "@/lib/types/product";

const SECTION_ICON: Record<string, string> = {
  Drinks: "🥤",
  Dairy: "🥛",
  Fruits: "🍎",
  Vegetables: "🥦",
  Bakery: "🍞",
  Snacks: "🍬",
  Frozen: "❄️",
  Food: "🍽️",
  Condiments: "🧂",
  Other: "📦",
};

interface Section {
  id: string;
  name: string;
  emoji: string | null;
}

interface Props {
  items: InventoryItem[];
  onSelect: (p: ResolvedProduct) => void;
  onDeleted?: () => void;
}

export function InventoryGroupedView({ items, onSelect, onDeleted }: Props) {
  const [sections, setSections] = useState<Section[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void supabase
      .from("sections")
      .select("id, name, emoji")
      .order("sort_order")
      .then(({ data }) => setSections(data ?? []));
  }, []);

  const byS: Record<string, InventoryItem[]> = {};
  for (const it of items) {
    const k = it.section_id ?? "other";
    (byS[k] ??= []).push(it);
  }

  const renderSection = (id: string, name: string, emoji: string | null) => {
    const list = byS[id];
    if (!list?.length) return null;
    const hasLow = list.some((i) => i.quantity <= i.limit_threshold);
    const isOpen = open[id] ?? true;
    return (
      <div key={id} className="rounded-xl border">
        <button
          onClick={() => setOpen({ ...open, [id]: !isOpen })}
          className="flex w-full items-center gap-2 p-3 text-sm font-semibold"
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span>{emoji}</span>
          <span>{name}</span>
          <span className="text-muted-foreground font-normal">({list.length})</span>
          {hasLow && <span className="h-2 w-2 rounded-full bg-orange-500" />}
        </button>
        {isOpen && (
          <div className="p-2 space-y-2 border-t">
            {mergeByName(list).map((group, idx) =>
              group.length === 1 ? (
                <ItemCard
                  key={group[0].id}
                  item={group[0]}
                  onSelect={onSelect}
                  onDeleted={onDeleted}
                />
              ) : (
                <InventoryMergedRow
                  key={`merged-${idx}`}
                  items={group}
                  onSelect={onSelect}
                  onDeleted={onDeleted}
                />
              ),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {sections.map((s) => renderSection(s.id, s.name, s.emoji))}
      {byS["other"] && renderSection("other", "Other", "📦")}
    </div>
  );
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\u00C0-\u017F\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4)
    .sort()
    .join(" ")
    .trim();
}

function mergeByName(items: InventoryItem[]): InventoryItem[][] {
  const groups = new Map<string, InventoryItem[]>();
  for (const it of items) {
    const name = it.product?.name ?? "";
    const key = normalizeName(name) || it.id;
    const bucket = groups.get(key) ?? [];
    bucket.push(it);
    groups.set(key, bucket);
  }
  return Array.from(groups.values());
}

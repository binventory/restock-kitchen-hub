import { useHousehold } from "@/contexts/HouseholdProvider";
import { Star, ChevronDown } from "lucide-react";
import { useState } from "react";

export function HouseholdSwitcher() {
  const { households, current, setCurrent } = useHousehold();
  const [open, setOpen] = useState(false);
  if (!current) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border bg-[var(--bg-elevated)] px-3 py-1.5 text-sm font-medium"
      >
        {current.is_default && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
        <span className="max-w-[140px] truncate">{current.name}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
      {open && (
        <ul
          className="absolute end-0 mt-1 min-w-48 rounded-lg border bg-[var(--bg-elevated)] shadow-lg z-50"
          onMouseLeave={() => setOpen(false)}
        >
          {households.map((h) => (
            <li key={h.id}>
              <button
                onClick={() => {
                  setCurrent(h);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-start"
              >
                {h.is_default && <Star className="h-3 w-3 fill-primary text-primary" />}
                <span className="flex-1 truncate">{h.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

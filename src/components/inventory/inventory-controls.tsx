import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, List, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  sort: "name" | "qty_asc" | "low_first";
  onSort: (v: "name" | "qty_asc" | "low_first") => void;
  filter: "all" | "low" | "out";
  onFilter: (v: "all" | "low" | "out") => void;
  view: "list" | "grouped";
  onView: (v: "list" | "grouped") => void;
}

export function InventoryControls(p: Props) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={p.search}
          onChange={(e) => p.onSearch(e.target.value)}
          placeholder="Search..."
          className="ps-9"
        />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={p.sort}
          onChange={(e) => p.onSort(e.target.value as "name")}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="name">Name A-Z</option>
          <option value="qty_asc">Quantity low-high</option>
          <option value="low_first">Low stock first</option>
        </select>
        <select
          value={p.filter}
          onChange={(e) => p.onFilter(e.target.value as "all")}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
        >
          <option value="all">All</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <div className="ms-auto flex">
          <Button
            size="icon"
            variant={p.view === "list" ? "default" : "outline"}
            onClick={() => p.onView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={p.view === "grouped" ? "default" : "outline"}
            onClick={() => p.onView("grouped")}
            className="ms-1"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

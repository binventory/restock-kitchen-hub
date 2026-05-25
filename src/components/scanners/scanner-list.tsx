import { useEffect, useState, useCallback } from "react";
import { Trash2, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHousehold } from "@/contexts/HouseholdProvider";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Scanner {
  id: string;
  name: string;
  location: string | null;
  last_seen_at: string | null;
  created_at: string;
}

interface Props {
  reloadKey: number;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function isOnline(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000;
}

export function ScannerList({ reloadKey }: Props) {
  const { current } = useHousehold();
  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Scanner | null>(null);
  const [, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    const { data } = await supabase
      .from("scanners")
      .select("id, name, location, last_seen_at, created_at")
      .eq("household_id", current.id)
      .order("created_at", { ascending: true });
    setScanners((data ?? []) as Scanner[]);
    setLoading(false);
  }, [current]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  useEffect(() => {
    if (!current) return;
    const ch = supabase
      .channel(`scanners:${current.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scanners",
          filter: `household_id=eq.${current.id}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [current, load]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    const { error } = await supabase
      .from("scanners")
      .delete()
      .eq("id", pendingDelete.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Scanner deleted");
      void load();
    }
    setPendingDelete(null);
    setBusyId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (scanners.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No scanners yet. Add one above to start auto-tracking your stock.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y rounded-lg border">
        {scanners.map((s) => {
          const online = isOnline(s.last_seen_at);
          return (
            <li key={s.id} className="flex items-center gap-3 p-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  online ? "bg-green-500" : "bg-muted-foreground/40"
                }`}
                aria-label={online ? "online" : "offline"}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {s.location && (
                    <span className="inline-flex items-center gap-1 mr-1">
                      <MapPin className="h-3 w-3" />
                      {s.location}
                    </span>
                  )}
                  · last seen {timeAgo(s.last_seen_at)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPendingDelete(s)}
                aria-label="Delete scanner"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          );
        })}
      </ul>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this scanner?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.name}" will stop sending scans to this household.
              You can set up a new one anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

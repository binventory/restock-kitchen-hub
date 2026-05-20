import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

export interface Household {
  id: string;
  name: string;
  is_default: boolean;
}

interface HouseholdCtx {
  households: Household[];
  current: Household | null;
  setCurrent: (h: Household) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const Ctx = createContext<HouseholdCtx | null>(null);
const STORAGE_KEY = "restock.householdId";

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [current, setCurrentState] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setHouseholds([]);
      setCurrentState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("household_members")
      .select("is_default, households(id, name)")
      .eq("user_id", user.id);
    if (error || !data) {
      setLoading(false);
      return;
    }
    const list: Household[] = data
      .map((row) => {
        const h = row.households as { id: string; name: string } | null;
        return h ? { id: h.id, name: h.name, is_default: row.is_default } : null;
      })
      .filter((x): x is Household => x !== null);
    setHouseholds(list);
    const stored = localStorage.getItem(STORAGE_KEY);
    const chosen = list.find((h) => h.id === stored) ?? list.find((h) => h.is_default) ?? list[0] ?? null;
    setCurrentState(chosen);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setCurrent = useCallback((h: Household) => {
    setCurrentState(h);
    localStorage.setItem(STORAGE_KEY, h.id);
  }, []);

  return (
    <Ctx.Provider value={{ households, current, setCurrent, refresh, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useHousehold() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHousehold must be inside HouseholdProvider");
  return v;
}

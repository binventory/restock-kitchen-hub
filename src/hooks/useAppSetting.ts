import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

async function fetchSetting(key: string): Promise<string> {
  if (cache.has(key)) return cache.get(key)!;
  if (pending.has(key)) return pending.get(key)!;
  const p = (async () => {
    const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
    const v = data?.value ?? "";
    cache.set(key, v);
    pending.delete(key);
    return v;
  })();
  pending.set(key, p);
  return p;
}

export function useAppSetting(key: string, fallback = ""): string {
  const [v, setV] = useState<string>(cache.get(key) ?? fallback);
  useEffect(() => {
    let alive = true;
    fetchSetting(key).then((val) => {
      if (alive) setV(val || fallback);
    });
    return () => {
      alive = false;
    };
  }, [key, fallback]);
  return v;
}

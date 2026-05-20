// IoT scanner endpoint. Receives barcode + scanner token, runs lookup chain,
// updates inventory and shopping list.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Content-Type": "application/json",
};

function resp(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: SECURITY });
}

async function sha256(s: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return resp(405, { error: "Method not allowed" });

  let body: { scanner_token?: string; barcode?: string };
  try { body = await req.json(); } catch { return resp(400, { error: "Invalid JSON" }); }

  const { scanner_token, barcode } = body;
  if (!scanner_token || scanner_token.length > 100) return resp(400, { error: "Invalid input" });
  if (!barcode || !/^[0-9A-Za-z\-]{4,50}$/.test(barcode)) return resp(400, { error: "Invalid input" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: scanner } = await supabase
    .from("scanners").select("id, household_id").eq("token", scanner_token).maybeSingle();
  if (!scanner) return resp(401, { error: "Unauthorized" });

  // Rate limit
  const hash = await sha256(scanner_token);
  const cutoff = new Date(Date.now() - 3600 * 1000).toISOString();
  const { data: rl } = await supabase
    .from("scanner_rate_limits").select("id, request_count")
    .eq("scanner_token_hash", hash).gt("window_start", cutoff).maybeSingle();
  if (rl && rl.request_count >= 60) return resp(429, { error: "Rate limit" });
  if (rl) await supabase.from("scanner_rate_limits").update({ request_count: rl.request_count + 1 }).eq("id", rl.id);
  else await supabase.from("scanner_rate_limits").insert({ scanner_token_hash: hash, request_count: 1 });

  const householdId = scanner.household_id;

  // Lookup chain
  let productId: string | null = null;
  let userProductId: string | null = null;
  let productName = barcode;
  let imageUrl: string | null = null;

  const { data: global } = await supabase
    .from("products").select("id, name, image_url").eq("barcode", barcode).eq("is_approved", true).maybeSingle();
  if (global) {
    productId = global.id; productName = global.name; imageUrl = global.image_url;
  } else {
    const { data: hm } = await supabase.from("household_members").select("user_id").eq("household_id", householdId);
    const ids = (hm ?? []).map((r) => r.user_id);
    if (ids.length > 0) {
      const { data: up } = await supabase
        .from("user_products").select("id, name, image_url").eq("barcode", barcode).in("user_id", ids).maybeSingle();
      if (up) { userProductId = up.id; productName = up.name; imageUrl = up.image_url; }
    }
    if (!productId && !userProductId) {
      const { data: created } = await supabase
        .from("user_products").insert({
          barcode, name: barcode, submission_status: "pending_approval", user_id: null,
        }).select("id, name").single();
      if (created) { userProductId = created.id; productName = created.name; }
    }
  }

  // Find or create inventory row
  const col = productId ? "product_id" : "user_product_id";
  const refId = productId ?? userProductId!;
  const { data: inv } = await supabase
    .from("inventory").select("id, quantity, limit_threshold")
    .eq("household_id", householdId).eq(col, refId).maybeSingle();

  let invId: string;
  let limit = 1;
  let newQty = 0;
  if (inv) {
    invId = inv.id;
    limit = Number(inv.limit_threshold);
    newQty = Math.max(0, Number(inv.quantity) - 1);
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", invId);
  } else {
    const { data: created } = await supabase
      .from("inventory").insert({
        household_id: householdId, [col]: refId, quantity: 0, limit_threshold: 1,
      }).select("id").single();
    invId = created!.id;
  }

  let addedToShopping = false;
  if (newQty <= limit) {
    const { data: existing } = await supabase
      .from("shopping_list").select("id")
      .eq("household_id", householdId).eq("is_checked", false).eq(col, refId).maybeSingle();
    if (!existing) {
      await supabase.from("shopping_list").insert({
        household_id: householdId, [col]: refId, added_automatically: true, needed_quantity: 1,
      });
      addedToShopping = true;
    }
  }

  await supabase.from("scanners").update({ last_seen_at: new Date().toISOString() }).eq("id", scanner.id);
  await supabase.channel(`household:${householdId}`).send({
    type: "broadcast", event: "scan", payload: { barcode, new_quantity: newQty },
  });

  return resp(200, {
    success: true, product_name: productName, image_url: imageUrl,
    new_quantity: newQty, added_to_shopping_list: addedToShopping,
  });
});

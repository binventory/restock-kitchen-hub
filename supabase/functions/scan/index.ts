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
  return Array.from(new Uint8Array(h))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return resp(405, { error: "Method not allowed" });

  let body: { scanner_token?: string; barcode?: string };
  try {
    body = await req.json();
  } catch {
    return resp(400, { error: "Invalid JSON" });
  }

  const { scanner_token, barcode } = body;
  if (!scanner_token || scanner_token.length > 100) return resp(400, { error: "Invalid input" });
  if (!barcode || !/^[0-9A-Za-z\-]{4,50}$/.test(barcode)) return resp(400, { error: "Invalid input" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: scanner } = await supabase
    .from("scanners")
    .select("id, household_id")
    .eq("token", scanner_token)
    .maybeSingle();
  if (!scanner) return resp(401, { error: "Unauthorized" });

  // Rate limit
  const hash = await sha256(scanner_token);
  const cutoff = new Date(Date.now() - 3600 * 1000).toISOString();
  const { data: rl } = await supabase
    .from("scanner_rate_limits")
    .select("id, request_count")
    .eq("scanner_token_hash", hash)
    .gt("window_start", cutoff)
    .maybeSingle();
  if (rl && rl.request_count >= 60) return resp(429, { error: "Rate limit" });
  if (rl)
    await supabase
      .from("scanner_rate_limits")
      .update({ request_count: rl.request_count + 1 })
      .eq("id", rl.id);
  else await supabase.from("scanner_rate_limits").insert({ scanner_token_hash: hash, request_count: 1 });

  const householdId = scanner.household_id;

  // Resolve product
  let productId: string | null = null;
  let userProductId: string | null = null;
  let productName = barcode;
  let imageUrl: string | null = null;

  const { data: global } = await supabase
    .from("products")
    .select("id, name, image_url")
    .eq("barcode", barcode)
    .eq("is_approved", true)
    .maybeSingle();
  if (global) {
    productId = global.id;
    productName = global.name;
    imageUrl = global.image_url;
  } else {
    // Find the household's owner (used to attribute scanner-created products).
    const { data: ownerRow } = await supabase
      .from("household_members")
      .select("user_id")
      .eq("household_id", householdId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    const ownerId = ownerRow?.user_id ?? null;

    // Collect all household member ids to search for an existing user_product.
    const { data: hm } = await supabase.from("household_members").select("user_id").eq("household_id", householdId);
    const memberIds = (hm ?? []).map((r) => r.user_id);

    if (memberIds.length > 0) {
      const { data: existing } = await supabase
        .from("user_products")
        .select("id, name, image_url")
        .eq("barcode", barcode)
        .in("user_id", memberIds)
        .order("created_at", { ascending: true })
        .limit(1);
      if (existing && existing.length > 0) {
        userProductId = existing[0].id;
        productName = existing[0].name;
        imageUrl = existing[0].image_url;
      }
    }

    if (!productId && !userProductId && ownerId) {
      // Attribute the scanner-created product to the owner so the next
      // scan finds it via the member-id lookup above. The unique index
      // user_products_uniq_user_barcode prevents racing duplicates; on
      // a 23505 conflict we re-fetch the existing row.
      const { data: created, error: insErr } = await supabase
        .from("user_products")
        .insert({
          barcode,
          name: barcode,
          submission_status: "pending_approval",
          user_id: ownerId,
        })
        .select("id, name, image_url")
        .single();
      if (created) {
        userProductId = created.id;
        productName = created.name;
        imageUrl = created.image_url;
      } else if (insErr) {
        const { data: again } = await supabase
          .from("user_products")
          .select("id, name, image_url")
          .eq("barcode", barcode)
          .eq("user_id", ownerId)
          .limit(1);
        if (again && again.length > 0) {
          userProductId = again[0].id;
          productName = again[0].name;
          imageUrl = again[0].image_url;
        } else {
          return resp(500, { error: "Could not register product" });
        }
      }
    }

    if (!productId && !userProductId) {
      return resp(500, { error: "Could not register product" });
    }
  }

  // Find or create inventory row (now safe — unique index prevents duplicates).
  const col = productId ? "product_id" : "user_product_id";
  const refId = productId ?? userProductId!;
  const { data: invList } = await supabase
    .from("inventory")
    .select("id, quantity, limit_threshold")
    .eq("household_id", householdId)
    .eq(col, refId)
    .order("created_at", { ascending: true })
    .limit(1);

  let invId: string;
  let limit = 1;
  let newQty = 0;
  if (invList && invList.length > 0) {
    const inv = invList[0];
    invId = inv.id;
    limit = Number(inv.limit_threshold);
    newQty = Math.max(0, Number(inv.quantity) - 1);
    await supabase.from("inventory").update({ quantity: newQty }).eq("id", invId);
  } else {
    const insertPayload: Record<string, unknown> = {
      household_id: householdId,
      [col]: refId,
      quantity: 0,
      limit_threshold: 1,
    };
    const { data: created, error: invErr } = await supabase
      .from("inventory")
      .insert(insertPayload)
      .select("id")
      .single();
    if (created) {
      invId = created.id;
    } else if (invErr) {
      // Concurrent insert lost the race — re-fetch.
      const { data: retry } = await supabase
        .from("inventory")
        .select("id, quantity, limit_threshold")
        .eq("household_id", householdId)
        .eq(col, refId)
        .limit(1);
      if (!retry || retry.length === 0) return resp(500, { error: "Could not update inventory" });
      invId = retry[0].id;
      limit = Number(retry[0].limit_threshold);
      newQty = Math.max(0, Number(retry[0].quantity) - 1);
      await supabase.from("inventory").update({ quantity: newQty }).eq("id", invId);
    } else {
      return resp(500, { error: "Could not update inventory" });
    }
  }

  let addedToShopping = false;
  if (newQty <= limit) {
    const { data: existing } = await supabase
      .from("shopping_list")
      .select("id")
      .eq("household_id", householdId)
      .eq("is_checked", false)
      .eq(col, refId)
      .maybeSingle();
    if (!existing) {
      await supabase.from("shopping_list").insert({
        household_id: householdId,
        [col]: refId,
        added_automatically: true,
        needed_quantity: 1,
      });
      addedToShopping = true;
    }
  }

  await supabase.from("scanners").update({ last_seen_at: new Date().toISOString() }).eq("id", scanner.id);
  await supabase.channel(`household:${householdId}`).send({
    type: "broadcast",
    event: "scan",
    payload: { barcode, new_quantity: newQty },
  });

  return resp(200, {
    success: true,
    product_name: productName,
    image_url: imageUrl,
    new_quantity: newQty,
    added_to_shopping_list: addedToShopping,
  });
});

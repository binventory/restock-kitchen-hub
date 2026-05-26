import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    const prompt: string = (body.prompt ?? "").trim();
    if (prompt.length < 3 || prompt.length > 500) {
      return json({ error: "Prompt must be 3–500 characters" }, 400);
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id")
      .eq("user_id", userId)
      .maybeSingle();
    const { data: plan } = await supabase
      .from("plans")
      .select("ai_requests_per_month, ai_assistant_enabled")
      .eq("id", sub?.plan_id)
      .maybeSingle();
    if (!plan?.ai_assistant_enabled) {
      return json({ error: "AI Cook not on your plan." }, 403);
    }
    const quota = plan.ai_requests_per_month ?? 10;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count: used } = await supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", "cook")
      .gte("created_at", monthStart.toISOString());
    if ((used ?? 0) >= quota) {
      return json({ error: "Monthly AI quota reached.", used, quota }, 429);
    }

    const { data: member } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle();
    if (!member?.household_id) return json({ error: "No household" }, 400);
    const { data: inv } = await supabase
      .from("inventory")
      .select("quantity, products(name), user_products(name)")
      .eq("household_id", member.household_id)
      .gt("quantity", 0);
    const stock = (inv ?? [])
      // deno-lint-ignore no-explicit-any
      .map((r: any) => r.products?.name ?? r.user_products?.name)
      .filter(Boolean)
      .slice(0, 50)
      .join(", ");

    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["ai_provider_url", "ai_model", "ai_provider_api_key"]);
    const cfg: Record<string, string> = {};
    // deno-lint-ignore no-explicit-any
    (settings ?? []).forEach((s: any) => {
      cfg[s.key] = s.value;
    });
    if (!cfg.ai_provider_api_key)
      return json({ error: "AI not configured" }, 503);

    const systemMsg = `You are a friendly home-cooking assistant. The user has this stock: ${stock || "(empty)"}. Suggest 2-3 recipes that mostly use what they have. For each recipe: name, time, 1-sentence description, ingredient list with (have) / (need) tags, and 4-6 numbered steps. Under 400 words. Respect dietary restrictions in the prompt.`;

    const aiStart = Date.now();
    const aiRes = await fetch(cfg.ai_provider_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.ai_provider_api_key}`,
      },
      body: JSON.stringify({
        model: cfg.ai_model,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });
    if (!aiRes.ok) return json({ error: "AI unavailable" }, 502);
    const aiData = await aiRes.json();
    const recipe = aiData?.choices?.[0]?.message?.content ?? "";
    const tokens = aiData?.usage?.total_tokens ?? 0;

    await supabase.from("ai_usage").insert({
      user_id: userId,
      feature: "cook",
      tokens_used: tokens,
      latency_ms: Date.now() - aiStart,
      prompt_length: prompt.length,
    });

    return json({ recipe, used: (used ?? 0) + 1, quota, tokens });
  } catch (e) {
    console.error("ai-cook:", e);
    return json({ error: "Internal error" }, 500);
  }
});

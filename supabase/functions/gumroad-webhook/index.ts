// MailSweep: gumroad-webhook edge function
//
// Receives Gumroad purchase pings (form-urlencoded POSTs) and updates
// the users table: is_paid=true on sale, is_paid=false on refund/dispute.
//
// Security: optional seller_id check via GUMROAD_SELLER_ID secret.
// Until that's set, we accept any POST — relies on URL secrecy.
//
// Reference: https://help.gumroad.com/article/40-webhooks

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  try {
    const form = await req.formData();
    const payload: Record<string, string> = {};
    for (const [k, v] of form.entries()) payload[k] = String(v);

    const expectedSellerId = Deno.env.get("GUMROAD_SELLER_ID");
    if (expectedSellerId && payload.seller_id !== expectedSellerId) {
      console.error("seller_id mismatch: got " + payload.seller_id);
      return new Response("forbidden", { status: 403 });
    }

    const email = payload.email;
    if (!email) {
      return new Response("missing email", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const secretKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SECRET_KEY")!;
    const supabase = createClient(supabaseUrl, secretKey);

    const refunded = payload.refunded === "true";
    const disputed = payload.disputed === "true";
    const chargedback = payload.chargedback === "true";
    const isPaid = !(refunded || disputed || chargedback);

    const { error } = await supabase
      .from("users")
      .upsert(
        {
          email_id: email,
          is_paid: isPaid,
          is_blocked: false,
        },
        { onConflict: "email_id" }
      );

    if (error) throw error;

    console.log("processed sale: " + email + " is_paid=" + isPaid);
    return new Response(
      JSON.stringify({ ok: true, email, is_paid: isPaid }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("webhook error: " + (e as Error).message);
    return new Response(
      JSON.stringify({ error: String((e as Error).message) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

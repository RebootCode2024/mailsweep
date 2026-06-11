// MailSweep: validate-user edge function
//
// Called by the Gmail add-on before initiating a delete.
// Looks up the user by email and decides:
//   - paid       → unlimited deletes allowed
//   - trial      → first delete of the day during trial; records the use
//   - used_today → already deleted today during trial; show paywall
//   - trial_over → 3-day trial expired; show paywall
//
// Deployed via the Supabase dashboard. URL slug ended up as
// `clever-processor` (auto-generated, can't rename slug after create).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

interface ReqPayload {
  email: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
};

const TRIAL_DAYS = 3;
const PRICE_TEXT = "$3";

export default {
  fetch: withSupabase({ auth: ["secret"] }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

    try {
      const { email }: ReqPayload = await req.json();
      if (!email) {
        return new Response(JSON.stringify({ error: "missing email" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }

      const supabase = ctx.supabase;
      const today = new Date().toISOString().slice(0, 10);

      let { data: user, error: selErr } = await supabase
        .from("users")
        .select("*")
        .eq("email_id", email)
        .maybeSingle();
      if (selErr) throw selErr;

      if (!user) {
        const { data: created, error: insErr } = await supabase
          .from("users")
          .insert({ email_id: email, trial_start_date: today })
          .select()
          .single();
        if (insErr) throw insErr;
        user = created;
      }

      if (user.is_paid) {
        return new Response(JSON.stringify({ allowed: true, status: "paid" }), {
          headers: jsonHeaders,
        });
      }

      if (user.is_blocked) {
        return new Response(JSON.stringify({
          allowed: false,
          status: "trial_over",
          message: `Your ${TRIAL_DAYS}-day free trial is over. Pay ${PRICE_TEXT} once and clean your inbox forever.`,
        }), { headers: jsonHeaders });
      }

      if (user.last_delete_date === today) {
        return new Response(JSON.stringify({
          allowed: false,
          status: "used_today",
          message: `You've already used your free delete today. Come back tomorrow — or unlock unlimited access for just ${PRICE_TEXT}.`,
        }), { headers: jsonHeaders });
      }

      const newDaysUsed = (user.trial_days_used || 0) + 1;
      const willBeBlocked = newDaysUsed >= TRIAL_DAYS;
      const { error: upErr } = await supabase
        .from("users")
        .update({
          last_delete_date: today,
          trial_days_used: newDaysUsed,
          is_blocked: willBeBlocked,
        })
        .eq("email_id", email);
      if (upErr) throw upErr;

      return new Response(JSON.stringify({
        allowed: true,
        status: "trial",
        days_left: Math.max(0, TRIAL_DAYS - newDaysUsed),
      }), { headers: jsonHeaders });

    } catch (e) {
      return new Response(JSON.stringify({
        error: String((e as Error)?.message || e),
      }), { status: 500, headers: jsonHeaders });
    }
  }),
};

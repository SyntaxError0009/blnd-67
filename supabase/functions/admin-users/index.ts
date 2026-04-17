import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const FAKE_DOMAIN = "nexus.local";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing auth" }, 401);

    // Verify caller is an admin
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return jsonResponse({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) return jsonResponse({ error: "Forbidden: admin only" }, 403);

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "");
      const lots = Number(body.lots ?? 0);
      const makeAdmin = !!body.is_admin;

      if (!/^[a-z0-9_]{3,30}$/.test(username))
        return jsonResponse({ error: "Username must be 3-30 chars: a-z, 0-9, _" }, 400);
      if (password.length < 6)
        return jsonResponse({ error: "Password must be at least 6 chars" }, 400);

      const email = `${username}@${FAKE_DOMAIN}`;
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });
      if (createErr) return jsonResponse({ error: createErr.message }, 400);

      // Update lots if provided
      if (lots > 0) {
        await admin.from("profiles").update({ lots }).eq("id", created.user!.id);
      }
      // Always assign 'user' role
      await admin.from("user_roles").insert({ user_id: created.user!.id, role: "user" });
      if (makeAdmin) {
        await admin.from("user_roles").insert({ user_id: created.user!.id, role: "admin" });
      }
      return jsonResponse({ ok: true, user_id: created.user!.id });
    }

    if (action === "delete") {
      const targetId = String(body.user_id || "");
      if (!targetId) return jsonResponse({ error: "user_id required" }, 400);
      if (targetId === userRes.user.id)
        return jsonResponse({ error: "Cannot delete yourself" }, 400);
      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ ok: true });
    }

    if (action === "update_lots") {
      const targetId = String(body.user_id || "");
      const newLots = Number(body.lots);
      const note = body.note ? String(body.note) : null;
      if (!targetId || Number.isNaN(newLots))
        return jsonResponse({ error: "user_id and lots required" }, 400);

      const { data: prev, error: pErr } = await admin
        .from("profiles")
        .select("lots")
        .eq("id", targetId)
        .single();
      if (pErr) return jsonResponse({ error: pErr.message }, 400);

      const previous = prev?.lots ?? 0;
      const { error: updErr } = await admin
        .from("profiles")
        .update({ lots: newLots })
        .eq("id", targetId);
      if (updErr) return jsonResponse({ error: updErr.message }, 400);

      await admin.from("lots_history").insert({
        user_id: targetId,
        changed_by: userRes.user.id,
        previous_lots: previous,
        new_lots: newLots,
        delta: newLots - previous,
        note,
      });
      return jsonResponse({ ok: true });
    }

    if (action === "reset_password") {
      const targetId = String(body.user_id || "");
      const password = String(body.password || "");
      if (!targetId || password.length < 6)
        return jsonResponse({ error: "user_id and password (>=6) required" }, 400);
      const { error } = await admin.auth.admin.updateUserById(targetId, { password });
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});

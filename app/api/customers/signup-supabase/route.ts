/**
 * Additive Phase 1 vertical slice: web customer signup → Supabase Auth + profiles.
 *
 * Does NOT replace /api/customers/signup (legacy customers + bcrypt + JWT cookie).
 * Feature flag: AUTH_SUPABASE_SIGNUP=1 (or body.use_supabase_auth=true for ops testing).
 *
 * TODO (Phase 1 remaining — auth unify):
 * - Wire customer login UI to supabase.auth.signInWithPassword (or exchange session cookie)
 * - Migrate existing `customers` rows → auth.users + profiles (one-time script)
 * - Retire customer_token JWT after dual-run period
 * - Provider path: provider_requests → same Supabase Auth identity
 * - Do not break production: keep legacy /api/customers/signup until cutover
 */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(ok: boolean, data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok, ...data }, { status });
}

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function isEmail(s: string) {
  const v = clean(s).toLowerCase();
  return !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function normalizePhone(raw: string) {
  let s = clean(raw).replace(/[^\d]/g, "");
  if (!s) return "";
  if (s.startsWith("00966")) s = s.slice(5);
  if (s.startsWith("966")) s = s.slice(3);
  if (s.startsWith("5")) s = `0${s}`;
  return s;
}

export async function POST(req: Request) {
  try {
    const enabled =
      process.env.AUTH_SUPABASE_SIGNUP === "1" ||
      process.env.AUTH_SUPABASE_SIGNUP === "true";

    const body = await req.json().catch(() => null);
    const forceFlag = body?.use_supabase_auth === true;

    if (!enabled && !forceFlag) {
      return json(
        false,
        {
          error: "supabase_signup_disabled",
          message:
            "مسار التسجيل عبر Supabase Auth معطّل. فعّل AUTH_SUPABASE_SIGNUP=1 أو استخدم المسار الحالي.",
        },
        503
      );
    }

    const name = clean(body?.name);
    const email = clean(body?.email).toLowerCase();
    const phone = normalizePhone(body?.phone || "");
    const password = clean(body?.password);
    const accepted = !!body?.accepted;
    const verifiedOtp = !!body?.verified_otp;

    if (!accepted) return json(false, { error: "must_accept" }, 400);
    if (!name || !phone || !password || !email) {
      return json(false, { error: "missing_fields" }, 400);
    }
    if (!isEmail(email)) return json(false, { error: "invalid_email" }, 400);
    if (phone.length < 9) return json(false, { error: "invalid_phone" }, 400);
    if (password.length < 6) return json(false, { error: "weak_password" }, 400);

    const { data: created, error: createErr } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: verifiedOtp,
      user_metadata: {
        name,
        phone,
        source: "web_signup_supabase_slice",
      },
    });

    if (createErr || !created?.user?.id) {
      const msg = (createErr?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return json(false, { error: "duplicate_entry" }, 409);
      }
      console.error("[signup-supabase] createUser", createErr?.message);
      return json(false, { error: "server_error" }, 500);
    }

    const userId = created.user.id;

    const { error: profileErr } = await supabaseServer.from("profiles").upsert(
      {
        id: userId,
        name,
        phone,
        email,
        phone_verified: verifiedOtp,
        email_verified: verifiedOtp,
        verification_method: verifiedOtp ? "email" : null,
        account_status: "active",
      },
      { onConflict: "id" }
    );

    if (profileErr) {
      console.error("[signup-supabase] profiles upsert", profileErr.message);
      // Auth user already created — still return id so ops can repair profile
      return json(false, { error: "profile_upsert_failed", id: userId }, 500);
    }

    return json(true, {
      id: userId,
      auth: "supabase",
      message: verifiedOtp ? "created" : "verification_required_otp",
    });
  } catch (e: any) {
    console.error("[signup-supabase]", e?.message || e);
    return json(false, { error: e?.message || "server_error" }, 500);
  }
}

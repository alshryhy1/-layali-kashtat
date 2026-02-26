import { NextResponse } from "next/server";
import { db } from "@/lib/db";
// nodemailer disabled for OTP-only flow
import bcrypt from "bcrypt";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(ok: boolean, data: any = {}, status = 200) {
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

async function getMailer() { return null; }

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const name = clean(body?.name);
    const email = clean(body?.email);
    const phone = normalizePhone(body?.phone || "");
    const password = clean(body?.password);
    const city = clean(body?.city);
    const service_type = clean(body?.service_type);
    const accepted = !!body?.accepted;

    const service_types = Array.isArray(body?.service_types)
      ? (body.service_types as string[]).map(clean).filter(Boolean)
      : (service_type ? [service_type] : []);

    if (!Array.isArray(body?.service_types) && !service_type) {
      return json(false, { code: "invalid_services_format", message: "invalid_services_format" }, 400);
    }
    const cleanedServices = Array.from(new Set(service_types.map((s) => s.replace(/\s+/g, " ").trim().toLowerCase()).filter(Boolean)));
    if (cleanedServices.length === 0) {
      return json(false, { code: "at_least_one_service_required", message: "at_least_one_service_required" }, 400);
    }
    if (cleanedServices.length > 3) {
      return json(false, { code: "maximum_3_services", message: "maximum_3_services" }, 400);
    }
    if (cleanedServices.some((s) => s.length < 3)) {
      return json(false, { code: "service_too_short", message: "service_too_short" }, 400);
    }
    if (cleanedServices.some((s) => s.length > 40)) {
      return json(false, { code: "service_too_long", message: "service_too_long" }, 400);
    }

    if (!accepted) return json(false, { code: "must_accept", message: "must_accept" }, 400);
    const missing = [];
    if (!name) missing.push("name");
    if (!email) missing.push("email");
    if (!password) missing.push("password");
    if (!phone) missing.push("phone");
    if (!city) missing.push("city");
    if (service_types.length === 0) missing.push("service_type");
    if (missing.length) return json(false, { code: "missing_fields", message: "missing_fields", missing }, 400);
    if (!isEmail(email)) return json(false, { code: "invalid_email", message: "invalid_email" }, 400);
    if (phone.length < 9) return json(false, { code: "invalid_phone", message: "invalid_phone" }, 400);

    const check = await db.query(
      "SELECT id FROM provider_requests WHERE phone = $1 OR email = $2 LIMIT 1",
      [phone, email || null]
    );
    if (check.rows.length > 0) {
      return json(false, { code: "duplicate_entry", message: "duplicate_entry" }, 409);
    }

    const hash = await bcrypt.hash(password, 10);
    const verification_token = crypto.randomBytes(24).toString("hex");
    const status = "pending";
    const servicesJoined = cleanedServices.join(", ");
    const verifiedOtp = !!body?.verified_otp;

    const ins = await db.query(
      "INSERT INTO provider_requests (name, email, phone, password_hash, city, service_type, status, is_verified, verification_token) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
      [name, email || null, phone, hash, city, servicesJoined, status, verifiedOtp ? true : false, verifiedOtp ? null : verification_token]
    );
    const id = ins.rows[0]?.id;

    return json(true, { id, message: verifiedOtp ? "created" : "verification_required_otp" }, 200);
  } catch (e: any) {
    return json(false, { code: "db_error", message: e?.message || "server_error" }, 500);
  }
}

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

type Payload = {
  locale?: "ar" | "en";

  // ✅ الشكل الجديد (الواجهة الحالية)
  name?: string;
  phone?: string;
  service_type?: string;

  // ✅ الشكل القديم (لو موجود بأي مكان)
  ownerName?: string;
  ownerPhone?: string;
  serviceType?: string;

  city?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "provider_signups.json");

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, JSON.stringify([], null, 2), "utf8");
  }
}

function pickString(v: any) {
  return String(v ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Payload | null;

    if (!body) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    // ✅ توحيد المفاتيح (يدعم الشكلين)
    const locale = body.locale === "en" ? "en" : "ar";
    const name = pickString(body.name || body.ownerName);
    const phone = pickString(body.phone || body.ownerPhone);
    const city = pickString(body.city);
    const serviceType = pickString(body.service_type || body.serviceType);

    if (!name || !phone || !city || !serviceType) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    await ensureFile();

    const raw = await fs.readFile(FILE_PATH, "utf8").catch(() => "[]");
    const list = (raw ? JSON.parse(raw) : []) as any[];

    const id = crypto.randomUUID();

    const item = {
      id,
      createdAt: new Date().toISOString(),
      locale,

      // ✅ نخزن بصيغة موحّدة
      name,
      phone,
      city,
      serviceType,

      // ✅ حقول توافق (لو احتجتها قدّام)
      ownerName: name,
      ownerPhone: phone,
      service_type: serviceType,
    };

    list.push(item);
    await fs.writeFile(FILE_PATH, JSON.stringify(list, null, 2), "utf8");

    // ✅ مهم: نخلي الواجهة تستقبل ref
    return NextResponse.json({ ok: true, ref: id, id });
  } catch {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type Payload = {
  locale?: "ar" | "en";
  ownerName: string;
  ownerPhone: string;
  workerPhone?: string;
  city: string;
  serviceType: string;
  showWorkerPhoneToCustomer?: boolean;
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    if (
      !body.ownerName ||
      !body.ownerPhone ||
      !body.city ||
      !body.serviceType
    ) {
      return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    await ensureFile();
    const raw = await fs.readFile(FILE_PATH, "utf8");
    const list = JSON.parse(raw) as any[];

    const item = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      locale: body.locale ?? "ar",
      ownerName: body.ownerName.trim(),
      ownerPhone: String(body.ownerPhone).trim(),
      workerPhone: String(body.workerPhone ?? "").trim(),
      city: body.city.trim(),
      serviceType: body.serviceType.trim(),
      showWorkerPhoneToCustomer: Boolean(body.showWorkerPhoneToCustomer),
    };

    list.push(item);
    await fs.writeFile(FILE_PATH, JSON.stringify(list, null, 2), "utf8");

    return NextResponse.json({ ok: true, id: item.id });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

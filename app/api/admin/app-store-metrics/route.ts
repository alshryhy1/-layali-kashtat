import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth-admin";
import { db } from "@/lib/db";
import { getAppStoreMetrics, readAscConfig } from "@/lib/app-downloads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/app-store-metrics
 * Admin-only App Store Connect download metrics (auto-refresh with cache TTL).
 * ?refresh=1 forces a live ASC fetch.
 */
export async function GET(req: Request) {
  try {
    const token = (await cookies()).get("kashtat_admin")?.value;
    if (!verifyAdminSession(token)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get("refresh") === "1";
    const metrics = await getAppStoreMetrics(db, { forceRefresh });
    const cfg = readAscConfig();

    return NextResponse.json({
      ok: true,
      metrics: {
        firstTimeDownloads: metrics.firstTimeDownloads,
        source: metrics.source,
        sourceLabelAr: metrics.sourceLabelAr,
        sourceLabelEn: metrics.sourceLabelEn,
        lastUpdatedAt: metrics.lastUpdatedAt,
        cacheHit: metrics.cacheHit,
        cacheTtlHours: metrics.cacheTtlHours,
        appId: metrics.appId,
      },
      setup: {
        configured: metrics.configured,
        keyMaterialPresent: metrics.keyMaterialPresent,
        missing: metrics.missing,
        hasVendorNumber: metrics.hasVendorNumber,
        keyIdPresent: metrics.keyIdPresent,
        issuerPresent: metrics.issuerPresent,
        privateKeyPresent: metrics.privateKeyPresent,
        privateKeyFromDisk: Boolean(cfg.keyPath),
        keyPath: cfg.keyPath,
        jwtError: metrics.jwtError || cfg.jwtError,
        verify: metrics.verify,
        stepsAr: metrics.setupStepsAr,
        instructionsAr: [
          "1) App Store Connect → Users and Access → Integrations → App Store Connect API",
          "2) انسخ Issuer ID (UUID) → ASC_ISSUER_ID في .env.local أو ~/.appstoreconnect/issuer_id",
          "3) Key ID + ملف AuthKey_XXXX.p8 في ~/.appstoreconnect/private_keys/ (موجود محلياً إن وُجد)",
          "4) اختياري أسرع: ASC_VENDOR_NUMBER من Payments and Financial Reports",
          "5) ASC_APP_ID=6771470757 ثم أعد تشغيل npm run dev وحدّث /admin/reports",
          "6) التقارير الأولى من Analytics قد تتأخر ٢٤–٤٨ ساعة بعد أول طلب",
        ],
      },
    });
  } catch (e: any) {
    console.error("app-store-metrics error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

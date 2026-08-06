import fs from "fs";
import path from "path";
import os from "os";
import zlib from "zlib";
import crypto from "crypto";
import type { Pool } from "pg";
import jwt from "jsonwebtoken";

export type DownloadsSource = "asc" | "asc_cache" | "unavailable";

export type DownloadsResult = {
  count: number | null;
  source: DownloadsSource;
  sourceLabelAr: string;
  sourceLabelEn: string;
  ascConfigured: boolean;
  ascKeyMaterialPresent: boolean;
  missing: string[];
  ascAppId: string;
  lastUpdatedAt: string | null;
  cacheHit: boolean;
  detail?: string | null;
  setupStepsAr?: string[];
  /** Original crypto/JWT error when .p8 cannot sign ES256 (never includes key body). */
  jwtError?: string | null;
};

export const IOS_DOWNLOADS_ANALYTICS_KEY = "ios_app_downloads";
export const IOS_DOWNLOADS_TS_KEY = "ios_app_downloads_ts";
export const DEFAULT_ASC_APP_ID = "6771470757";

/** Cache TTL for ASC fetches (default 12h). */
function cacheTtlMs(): number {
  const hours = Number(process.env.ASC_DOWNLOADS_CACHE_HOURS || "12");
  const h = Number.isFinite(hours) && hours > 0 ? hours : 12;
  return h * 60 * 60 * 1000;
}

type AscConfig = {
  keyId: string;
  issuerId: string;
  privateKey: string;
  appId: string;
  vendorNumber: string;
  keyMaterialPresent: boolean;
  /** True only when keyId + issuerId + parseable ES256 private key are all present. */
  configured: boolean;
  missing: string[];
  keyPath: string | null;
  /** Original Node/OpenSSL/jsonwebtoken error message (no key body). */
  jwtError: string | null;
};

const PEM_BODY_B64_RE = /^[A-Za-z0-9+/=\s]+$/;

/**
 * Validate ASC .p8 material for ES256 without logging key contents.
 * Distinguishes placeholder/non-base64 PEM bodies from crypto/JWT failures.
 */
export function validateAscPrivateKey(pem: string): { ok: true } | { ok: false; error: string } {
  const trimmed = (pem || "").trim();
  if (!trimmed) return { ok: false, error: "private key is empty" };

  const lines = trimmed.split(/\r?\n/).filter((l) => l.length > 0);
  const begin = lines[0] || "";
  const end = lines[lines.length - 1] || "";
  if (!begin.includes("BEGIN PRIVATE KEY") || !end.includes("END PRIVATE KEY")) {
    return {
      ok: false,
      error: "PEM markers missing (expected -----BEGIN PRIVATE KEY----- / -----END PRIVATE KEY-----)",
    };
  }

  const body = lines.slice(1, -1).join("");
  if (!body) {
    return { ok: false, error: "PEM body empty between BEGIN/END markers" };
  }
  if (!PEM_BODY_B64_RE.test(body) || /[\u0600-\u06FF]/.test(body) || body.includes("الصق")) {
    return {
      ok: false,
      error:
        "PEM body is not base64 key material (placeholder or non-ASCII text between BEGIN/END). Replace AuthKey_*.p8 with the real file downloaded from App Store Connect.",
    };
  }

  try {
    const keyObj = crypto.createPrivateKey(trimmed);
    if (keyObj.asymmetricKeyType !== "ec") {
      return {
        ok: false,
        error: `private key type is "${keyObj.asymmetricKeyType || "unknown"}" — ASC requires EC (ES256) PKCS#8 .p8`,
      };
    }
  } catch (e: any) {
    const msg = e?.message || String(e);
    const stack = typeof e?.stack === "string" ? e.stack.split("\n").slice(0, 4).join(" | ") : "";
    return {
      ok: false,
      error: `crypto.createPrivateKey failed: ${msg}${stack ? ` | ${stack}` : ""}`,
    };
  }

  return { ok: true };
}

function expandHome(p: string) {
  if (!p) return p;
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

function detectKeyIdFromDisk(): { keyId: string; keyPath: string } | null {
  const dir = path.join(os.homedir(), ".appstoreconnect", "private_keys");
  try {
    const files = fs.readdirSync(dir).filter((f) => /^AuthKey_[A-Z0-9]+\.p8$/i.test(f));
    if (files.length === 0) return null;
    const file = files[0];
    const m = file.match(/^AuthKey_([A-Z0-9]+)\.p8$/i);
    if (!m) return null;
    return { keyId: m[1], keyPath: path.join(dir, file) };
  } catch {
    return null;
  }
}

function loadPrivateKey(explicitPath: string | null, keyId: string): { key: string; keyPath: string | null } {
  const envKey =
    process.env.APP_STORE_CONNECT_PRIVATE_KEY ||
    process.env.ASC_PRIVATE_KEY ||
    process.env.ASC_API_KEY_P8 ||
    "";
  if (envKey.trim()) {
    return { key: envKey.replace(/\\n/g, "\n").trim(), keyPath: null };
  }

  const candidates = [
    explicitPath,
    process.env.APP_STORE_CONNECT_PRIVATE_KEY_PATH,
    process.env.ASC_PRIVATE_KEY_PATH,
    keyId ? path.join(os.homedir(), ".appstoreconnect", "private_keys", `AuthKey_${keyId}.p8`) : null,
  ]
    .filter(Boolean)
    .map((p) => expandHome(String(p)));

  for (const p of candidates) {
    try {
      if (p && fs.existsSync(p)) {
        return { key: fs.readFileSync(p, "utf8").trim(), keyPath: p };
      }
    } catch {
      /* continue */
    }
  }
  return { key: "", keyPath: null };
}

function readIssuerId(): string {
  const fromEnv =
    process.env.APP_STORE_CONNECT_ISSUER_ID ||
    process.env.ASC_ISSUER_ID ||
    "";
  if (fromEnv.trim()) return fromEnv.trim();

  const fileCandidates = [
    process.env.ASC_ISSUER_ID_FILE,
    path.join(os.homedir(), ".appstoreconnect", "issuer_id"),
    path.join(os.homedir(), ".appstoreconnect", "issuer_id.txt"),
  ]
    .filter(Boolean)
    .map((p) => expandHome(String(p)));

  for (const p of fileCandidates) {
    try {
      if (p && fs.existsSync(p)) {
        const v = fs.readFileSync(p, "utf8").trim();
        if (v) return v;
      }
    } catch {
      /* continue */
    }
  }
  return "";
}

export function readAscConfig(): AscConfig {
  const detected = detectKeyIdFromDisk();
  const keyId =
    process.env.APP_STORE_CONNECT_API_KEY_ID ||
    process.env.ASC_API_KEY_ID ||
    process.env.ASC_KEY_ID ||
    detected?.keyId ||
    "";
  const issuerId = readIssuerId();
  const { key: privateKey, keyPath } = loadPrivateKey(detected?.keyPath || null, keyId);
  const appId =
    process.env.ASC_APP_ID ||
    process.env.APP_STORE_CONNECT_APP_ID ||
    process.env.EXPO_ASC_APP_ID ||
    DEFAULT_ASC_APP_ID;
  const vendorNumber =
    process.env.ASC_VENDOR_NUMBER || process.env.APP_STORE_VENDOR_NUMBER || "";

  const missing: string[] = [];
  if (!keyId) missing.push("ASC_KEY_ID");
  if (!issuerId) missing.push("ASC_ISSUER_ID");
  if (!privateKey) missing.push("APP_STORE_CONNECT_PRIVATE_KEY_PATH (.p8)");

  let jwtError: string | null = null;
  if (privateKey) {
    const validated = validateAscPrivateKey(privateKey);
    if (!validated.ok) {
      jwtError = validated.error;
      if (!missing.includes("APP_STORE_CONNECT_PRIVATE_KEY_PATH (.p8)")) {
        missing.push("valid AuthKey_*.p8 (ES256)");
      }
    } else if (keyId && keyPath) {
      const m = path.basename(keyPath).match(/^AuthKey_([A-Z0-9]+)\.p8$/i);
      if (m && m[1] !== keyId) {
        jwtError = `ASC_KEY_ID (${keyId}) does not match filename Key ID (${m[1]}) in ${path.basename(keyPath)}`;
      }
    }
  }

  // Probe jwt.sign so the portal gets the original jsonwebtoken message when crypto parse passed but sign fails.
  if (!jwtError && keyId && issuerId && privateKey) {
    try {
      const now = Math.floor(Date.now() / 1000);
      jwt.sign(
        { iss: issuerId, iat: now, exp: now + 60, aud: "appstoreconnect-v1" },
        privateKey,
        { algorithm: "ES256", header: { alg: "ES256", kid: keyId, typ: "JWT" } }
      );
    } catch (e: any) {
      jwtError = e?.message || String(e);
      const stack = typeof e?.stack === "string" ? e.stack.split("\n").slice(0, 5).join(" | ") : "";
      if (stack) jwtError = `${jwtError} | ${stack}`;
      missing.push("valid AuthKey_*.p8 (ES256)");
    }
  }

  const keyUsable = Boolean(privateKey && !jwtError);

  return {
    keyId,
    issuerId,
    privateKey,
    appId,
    vendorNumber,
    keyMaterialPresent: Boolean(keyId && privateKey),
    configured: Boolean(keyId && issuerId && keyUsable),
    missing,
    keyPath,
    jwtError,
  };
}

function setupStepsAr(cfg: AscConfig): string[] {
  const steps: string[] = [];
  if (!cfg.issuerId) {
    steps.push(
      "انسخ Issuer ID من App Store Connect → Users and Access → Integrations → App Store Connect API"
    );
    steps.push("أضفه في .env.local: ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
    steps.push("أو: echo 'UUID' > ~/.appstoreconnect/issuer_id ثم أعد تشغيل npm run dev");
  }
  if (!cfg.keyId || !cfg.privateKey) {
    steps.push("ضع ملف AuthKey_XXXX.p8 في ~/.appstoreconnect/private_keys/");
    steps.push("اضبط ASC_KEY_ID ليطابق اسم الملف");
  }
  if (cfg.jwtError) {
    steps.push(
      "ملف AuthKey_*.p8 الحالي لا يصلح لتوقيع JWT (ES256) — نزّل المفتاح الحقيقي من App Store Connect واستبدل الملف"
    );
    steps.push(`المسار المتوقع: ${cfg.keyPath || "~/.appstoreconnect/private_keys/AuthKey_<ASC_KEY_ID>.p8"}`);
    steps.push(`خطأ التوقيع: ${cfg.jwtError}`);
  }
  if (cfg.configured && !cfg.vendorNumber) {
    steps.push(
      "اختياري أسرع: ASC_VENDOR_NUMBER من Payments and Financial Reports لتفعيل Sales Reports فوراً"
    );
  }
  steps.push(`ASC_APP_ID=${cfg.appId || DEFAULT_ASC_APP_ID} (ليالي كشتات)`);
  return steps;
}

function makeAscJwt(cfg: AscConfig): string {
  if (cfg.jwtError) {
    throw new Error(cfg.jwtError);
  }
  const validated = validateAscPrivateKey(cfg.privateKey);
  if (!validated.ok) {
    throw new Error(validated.error);
  }
  const now = Math.floor(Date.now() / 1000);
  try {
    return jwt.sign(
      {
        iss: cfg.issuerId,
        iat: now,
        exp: now + 15 * 60,
        aud: "appstoreconnect-v1",
      },
      cfg.privateKey,
      {
        algorithm: "ES256",
        header: { alg: "ES256", kid: cfg.keyId, typ: "JWT" },
      }
    );
  } catch (e: any) {
    const msg = e?.message || String(e);
    const stack = typeof e?.stack === "string" ? e.stack.split("\n").slice(0, 6).join("\n") : "";
    throw new Error(stack ? `${msg}\n${stack}` : msg);
  }
}

async function ascFetch(cfg: AscConfig, url: string, init?: RequestInit): Promise<Response> {
  const token = makeAscJwt(cfg);
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

async function readAscErrorDetail(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as {
      errors?: Array<{ status?: string; code?: string; title?: string; detail?: string }>;
    };
    const err = json?.errors?.[0];
    if (!err) return `ASC HTTP ${res.status}`;
    return [
      `ASC HTTP ${res.status}`,
      err.code,
      err.title,
      err.detail,
    ]
      .filter(Boolean)
      .join(" — ");
  } catch {
    return `ASC HTTP ${res.status}`;
  }
}

export async function verifyAscApp(cfg: AscConfig): Promise<{ ok: boolean; name?: string; error?: string }> {
  if (!cfg.configured) return { ok: false, error: `missing: ${cfg.missing.join(", ")}` };
  try {
    const res = await ascFetch(cfg, `https://api.appstoreconnect.apple.com/v1/apps/${cfg.appId}`);
    if (!res.ok) {
      const detail = await readAscErrorDetail(res);
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error: `${detail} | تحقق أن ASC_KEY_ID يطابق Key ID للمفتاح الذي نُزّل معه هذا .p8، وأن ASC_ISSUER_ID صحيح وأن المفتاح غير ملغى`,
        };
      }
      return { ok: false, error: detail };
    }
    const json = (await res.json()) as { data?: { attributes?: { name?: string } } };
    return { ok: true, name: json?.data?.attributes?.name };
  } catch (e: any) {
    return { ok: false, error: e?.message || "ASC verify failed" };
  }
}

async function ensureAnalyticsReportRequest(cfg: AscConfig): Promise<void> {
  try {
    const listRes = await ascFetch(
      cfg,
      `https://api.appstoreconnect.apple.com/v1/apps/${cfg.appId}/analyticsReportRequests?limit=10`
    );
    if (!listRes.ok) return;
    const listJson = (await listRes.json()) as {
      data?: Array<{ attributes?: { accessType?: string } }>;
    };
    const hasOngoing = (listJson.data || []).some((r) => r.attributes?.accessType === "ONGOING");
    if (hasOngoing) return;

    // First Analytics report takes 1–2 days after this request.
    await ascFetch(cfg, "https://api.appstoreconnect.apple.com/v1/analyticsReportRequests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          type: "analyticsReportRequests",
          attributes: { accessType: "ONGOING" },
          relationships: {
            app: { data: { type: "apps", id: cfg.appId } },
          },
        },
      }),
    });
  } catch (e) {
    console.error("ASC ensure analytics request failed:", e);
  }
}

function maybeGunzip(buf: Buffer): string {
  if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    try {
      return zlib.gunzipSync(buf).toString("utf8");
    } catch {
      /* fall through */
    }
  }
  return buf.toString("utf8");
}

async function fetchSalesReportUnits(cfg: AscConfig): Promise<number | null> {
  if (!cfg.configured || !cfg.vendorNumber) return null;
  try {
    const token = makeAscJwt(cfg);
    const tryFetch = async (frequency: string, reportDate: string) => {
      const url = new URL("https://api.appstoreconnect.apple.com/v1/salesReports");
      url.searchParams.set("filter[frequency]", frequency);
      url.searchParams.set("filter[reportDate]", reportDate);
      url.searchParams.set("filter[reportType]", "SALES");
      url.searchParams.set("filter[reportSubType]", "SUMMARY");
      url.searchParams.set("filter[vendorNumber]", cfg.vendorNumber);
      return fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    };

    const year = String(new Date().getUTCFullYear());
    let res = await tryFetch("YEARLY", year);
    if (!res.ok) res = await tryFetch("YEARLY", String(Number(year) - 1));
    if (!res.ok) {
      // Daily reports for last ~7 days (lag ~1–2 days)
      let sum: number | null = null;
      for (let d = 2; d <= 8; d++) {
        const dt = new Date();
        dt.setUTCDate(dt.getUTCDate() - d);
        const ymd = dt.toISOString().slice(0, 10);
        const daily = await tryFetch("DAILY", ymd);
        if (!daily.ok) continue;
        const n = parseSalesTsvUnits(await daily.text(), cfg.appId);
        if (n != null) sum = (sum || 0) + n;
      }
      return sum;
    }
    return parseSalesTsvUnits(await res.text(), cfg.appId);
  } catch (e) {
    console.error("ASC sales report failed:", e);
    return null;
  }
}

function parseSalesTsvUnits(text: string, appId: string): number | null {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const headers = lines[0].split("\t");
  const unitsIdx = headers.findIndex((h) => /^units$/i.test(h.trim()));
  const typeIdx = headers.findIndex((h) => /product.?type.?identifier/i.test(h));
  const appleIdIdx = headers.findIndex((h) => /apple.?identifier|adam.?id/i.test(h));
  if (unitsIdx < 0) return null;

  let total = 0;
  let matchedApp = false;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const type = typeIdx >= 0 ? cols[typeIdx] : "";
    if (type && !/^(1|1F|1T|3|3F)$/i.test(type.trim())) continue;
    if (appleIdIdx >= 0 && cols[appleIdIdx] && appId) {
      if (String(cols[appleIdIdx]).trim() !== String(appId)) continue;
      matchedApp = true;
    }
    const n = Number(cols[unitsIdx] || 0);
    if (Number.isFinite(n)) total += n;
  }
  if (appleIdIdx >= 0 && matchedApp) return total;
  if (appleIdIdx >= 0 && !matchedApp) {
    // No row for this adam id
    return 0;
  }
  return total;
}

async function fetchAnalyticsFirstDownloads(cfg: AscConfig): Promise<number | null> {
  if (!cfg.configured) return null;
  try {
    await ensureAnalyticsReportRequest(cfg);

    const listRes = await ascFetch(
      cfg,
      `https://api.appstoreconnect.apple.com/v1/apps/${cfg.appId}/analyticsReportRequests?limit=10`
    );
    if (!listRes.ok) return null;
    const listJson = (await listRes.json()) as {
      data?: Array<{ id: string; attributes?: { accessType?: string } }>;
    };
    const requests = listJson.data || [];
    if (requests.length === 0) return null;

    for (const req of requests) {
      const reportsRes = await ascFetch(
        cfg,
        `https://api.appstoreconnect.apple.com/v1/analyticsReportRequests/${req.id}/reports?limit=50`
      );
      if (!reportsRes.ok) continue;
      const reportsJson = (await reportsRes.json()) as {
        data?: Array<{ id: string; attributes?: { name?: string; category?: string } }>;
      };
      const downloadsReport = (reportsJson.data || []).find((r) => {
        const name = `${r.attributes?.name || ""} ${r.attributes?.category || ""}`.toLowerCase();
        return name.includes("download");
      });
      if (!downloadsReport) continue;

      const instancesRes = await ascFetch(
        cfg,
        `https://api.appstoreconnect.apple.com/v1/analyticsReports/${downloadsReport.id}/instances?limit=20`
      );
      if (!instancesRes.ok) continue;
      const instancesJson = (await instancesRes.json()) as { data?: Array<{ id: string }> };
      const instance = instancesJson.data?.[0];
      if (!instance) continue;

      const segmentsRes = await ascFetch(
        cfg,
        `https://api.appstoreconnect.apple.com/v1/analyticsReportInstances/${instance.id}/segments?limit=20`
      );
      if (!segmentsRes.ok) continue;
      const segmentsJson = (await segmentsRes.json()) as {
        data?: Array<{ attributes?: { url?: string } }>;
      };
      const url = segmentsJson.data?.[0]?.attributes?.url;
      if (!url) continue;

      const fileRes = await fetch(url, { cache: "no-store" });
      if (!fileRes.ok) continue;
      const buf = Buffer.from(await fileRes.arrayBuffer());
      const body = maybeGunzip(buf);
      const parsed = parseAnalyticsDownloadsTsv(body);
      if (parsed != null) return parsed;
    }
    return null;
  } catch (e) {
    console.error("ASC analytics reports failed:", e);
    return null;
  }
}

function parseAnalyticsDownloadsTsv(text: string): number | null {
  const lines = text.split(/\r?\n/).filter((l) => l && !l.startsWith("#"));
  if (lines.length < 2) return null;
  const headers = lines[0].split("\t").map((h) => h.trim().toLowerCase());
  const firstIdx = headers.findIndex((h) => h.includes("first") && h.includes("download"));
  const countsIdx = headers.findIndex((h) => h === "counts" || h === "count" || h === "units");
  const idx = firstIdx >= 0 ? firstIdx : countsIdx;
  if (idx < 0) return null;
  let sum = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const n = Number(cols[idx] || 0);
    if (Number.isFinite(n)) sum += n;
  }
  return sum;
}

type CacheRow = { count: number; ts: number };

async function readAscCache(db: Pool): Promise<CacheRow | null> {
  try {
    const res = await db.query(
      `SELECT key, value, updated_at FROM site_analytics WHERE key = ANY($1)`,
      [[IOS_DOWNLOADS_ANALYTICS_KEY, IOS_DOWNLOADS_TS_KEY]]
    );
    let count: number | null = null;
    let ts: number | null = null;
    for (const row of res.rows) {
      if (row.key === IOS_DOWNLOADS_ANALYTICS_KEY) count = Number(row.value);
      if (row.key === IOS_DOWNLOADS_TS_KEY) ts = Number(row.value);
    }
    if (count == null || !Number.isFinite(count)) return null;
    if (ts == null || !Number.isFinite(ts) || ts <= 0) {
      // legacy row without ts — treat as expired
      return { count, ts: 0 };
    }
    return { count, ts };
  } catch {
    return null;
  }
}

async function writeAscCache(db: Pool, count: number): Promise<void> {
  const ts = Math.floor(Date.now() / 1000);
  await db.query(
    `INSERT INTO site_analytics (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [IOS_DOWNLOADS_ANALYTICS_KEY, Math.floor(count)]
  );
  await db.query(
    `INSERT INTO site_analytics (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [IOS_DOWNLOADS_TS_KEY, ts]
  );
}

async function fetchLiveAscCount(cfg: AscConfig): Promise<{ count: number; detail: string } | null> {
  const analytics = await fetchAnalyticsFirstDownloads(cfg);
  if (analytics != null) return { count: analytics, detail: "analytics_reports" };

  const sales = await fetchSalesReportUnits(cfg);
  if (sales != null) return { count: sales, detail: "sales_reports" };

  return null;
}

function formatUpdatedAt(tsSec: number | null): string | null {
  if (!tsSec || tsSec <= 0) return null;
  try {
    return new Date(tsSec * 1000).toISOString();
  } catch {
    return null;
  }
}

/**
 * Resolve first-time downloads from App Store Connect with DB cache (TTL).
 * No manual env/DB entry path — automatic ASC only.
 */
export async function resolveIosAppDownloads(
  db: Pool,
  opts?: { forceRefresh?: boolean }
): Promise<DownloadsResult> {
  const cfg = readAscConfig();
  const base = {
    ascConfigured: cfg.configured,
    ascKeyMaterialPresent: cfg.keyMaterialPresent,
    missing: cfg.missing,
    ascAppId: cfg.appId,
    setupStepsAr: setupStepsAr(cfg),
    jwtError: cfg.jwtError,
  };

  const cache = await readAscCache(db);
  const now = Date.now();
  const fresh =
    cache && cache.ts > 0 && now - cache.ts * 1000 < cacheTtlMs() && !opts?.forceRefresh;

  if (fresh && cache) {
    return {
      ...base,
      count: cache.count,
      source: "asc_cache",
      sourceLabelAr: "App Store Connect (مخزّن)",
      sourceLabelEn: "App Store Connect (cached)",
      lastUpdatedAt: formatUpdatedAt(cache.ts),
      cacheHit: true,
      detail: "cache_ttl",
    };
  }

  if (!cfg.configured) {
    // Show stale ASC cache if we ever fetched successfully before
    if (cache && cache.ts > 0) {
      return {
        ...base,
        count: cache.count,
        source: "asc_cache",
        sourceLabelAr: "App Store Connect (آخر جلب ناجح)",
        sourceLabelEn: "App Store Connect (last successful fetch)",
        lastUpdatedAt: formatUpdatedAt(cache.ts),
        cacheHit: true,
        detail: cfg.jwtError
          ? `jwt/key: ${cfg.jwtError}`
          : `missing: ${cfg.missing.join(", ")}`,
      };
    }
    const keyProblem = Boolean(cfg.jwtError);
    return {
      ...base,
      count: null,
      source: "unavailable",
      sourceLabelAr: keyProblem
        ? "التحديث التلقائي متوقف — ملف AuthKey غير صالح لتوقيع JWT"
        : "التحديث التلقائي متوقف — ينقص ASC_ISSUER_ID أو إعدادات ASC",
      sourceLabelEn: keyProblem
        ? "Auto-update stopped — AuthKey cannot sign JWT"
        : "Auto-update stopped — ASC credentials incomplete",
      lastUpdatedAt: null,
      cacheHit: false,
      detail: cfg.jwtError
        ? cfg.jwtError
        : cfg.missing.length
          ? `ناقص: ${cfg.missing.join(", ")}`
          : null,
    };
  }

  // Auth probe first — don't pretend "waiting for reports" on 401/403.
  const auth = await verifyAscApp(cfg);
  if (!auth.ok) {
    const authDetail = auth.error || "ASC auth failed";
    if (cache && cache.ts > 0) {
      return {
        ...base,
        count: cache.count,
        source: "asc_cache",
        sourceLabelAr: "App Store Connect (آخر جلب ناجح — فشل التحقق الحالي)",
        sourceLabelEn: "App Store Connect (last success — current auth failed)",
        lastUpdatedAt: formatUpdatedAt(cache.ts),
        cacheHit: true,
        detail: authDetail,
        jwtError: authDetail,
      };
    }
    return {
      ...base,
      count: null,
      source: "unavailable",
      sourceLabelAr: "فشل مصادقة App Store Connect (401/403) — راجع ASC_KEY_ID و ASC_ISSUER_ID",
      sourceLabelEn: "App Store Connect auth failed — check ASC_KEY_ID and ASC_ISSUER_ID",
      lastUpdatedAt: null,
      cacheHit: false,
      detail: authDetail,
      jwtError: authDetail,
      setupStepsAr: [
        ...(base.setupStepsAr || []),
        "JWT يُوقَّع محلياً بنجاح — المشكلة عند Apple: Key ID أو Issuer ID لا يطابقان هذا المفتاح، أو المفتاح ملغى",
        `ASC_KEY_ID الحالي=${cfg.keyId} — يجب أن يطابق Key ID الظاهر في App Store Connect لنفس ملف .p8`,
        `ASC_ISSUER_ID الحالي=${cfg.issuerId}`,
        authDetail,
      ],
    };
  }

  const live = await fetchLiveAscCount(cfg);
  if (live) {
    try {
      await writeAscCache(db, live.count);
    } catch (e) {
      console.error("Failed to cache ASC downloads:", e);
    }
    const ts = Math.floor(Date.now() / 1000);
    return {
      ...base,
      count: live.count,
      source: "asc",
      sourceLabelAr: "App Store Connect",
      sourceLabelEn: "App Store Connect",
      lastUpdatedAt: formatUpdatedAt(ts),
      cacheHit: false,
      detail: live.detail,
    };
  }

  // Configured but reports not ready yet — keep previous ASC cache if any
  if (cache && cache.ts > 0) {
    return {
      ...base,
      count: cache.count,
      source: "asc_cache",
      sourceLabelAr: "App Store Connect (بانتظار تقرير جديد)",
      sourceLabelEn: "App Store Connect (awaiting new report)",
      lastUpdatedAt: formatUpdatedAt(cache.ts),
      cacheHit: true,
      detail: "reports_pending",
    };
  }

  return {
    ...base,
    count: null,
    source: "unavailable",
    sourceLabelAr: "تم الربط — بانتظار أول تقرير من Apple (٢٤–٤٨ ساعة)",
    sourceLabelEn: "Linked — waiting for first Apple report (24–48h)",
    lastUpdatedAt: null,
    cacheHit: false,
    detail: cfg.vendorNumber
      ? "analytics_and_sales_empty"
      : "add_ASC_VENDOR_NUMBER_for_faster_sales_or_wait_for_analytics",
  };
}

export async function getAppStoreMetrics(db: Pool, opts?: { forceRefresh?: boolean }) {
  const cfg = readAscConfig();
  const downloads = await resolveIosAppDownloads(db, opts);
  let verify: { ok: boolean; name?: string; error?: string } | null = null;
  if (cfg.configured) {
    verify = await verifyAscApp(cfg);
  } else if (cfg.jwtError) {
    verify = { ok: false, error: cfg.jwtError };
  }
  return {
    appId: cfg.appId,
    configured: cfg.configured,
    keyMaterialPresent: cfg.keyMaterialPresent,
    missing: cfg.missing,
    hasVendorNumber: Boolean(cfg.vendorNumber),
    keyIdPresent: Boolean(cfg.keyId),
    issuerPresent: Boolean(cfg.issuerId),
    privateKeyPresent: Boolean(cfg.privateKey),
    keyPath: cfg.keyPath,
    jwtError: cfg.jwtError || downloads.jwtError || null,
    verify,
    firstTimeDownloads: downloads.count,
    source: downloads.source,
    sourceLabelAr: downloads.sourceLabelAr,
    sourceLabelEn: downloads.sourceLabelEn,
    lastUpdatedAt: downloads.lastUpdatedAt,
    cacheHit: downloads.cacheHit,
    setupStepsAr: downloads.setupStepsAr || [],
    cacheTtlHours: cacheTtlMs() / (60 * 60 * 1000),
  };
}

export function allowManualDownloadsFallback(): boolean {
  return process.env.ALLOW_MANUAL_APP_DOWNLOADS === "1";
}

// lib/db.ts
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

// ✅ في Vercel (Serverless) لازم نعيد استخدام Pool عالميًا
const pool =
  global.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Neon يحتاج SSL غالبًا
    ssl: { rejectUnauthorized: false },
    // إعدادات تخفف مشاكل serverless
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export async function query(text: string, params?: any[]) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }
  // ✅ استخدم pool.query مباشرة (أضمن في serverless)
  return pool.query(text, params);
}

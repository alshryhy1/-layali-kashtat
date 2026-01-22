import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

let pool: Pool;

try {
  if (!databaseUrl) {
    console.error("DATABASE_URL is missing");
  } else {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
    });
  }
} catch (e) {
  console.error("Failed to initialize database pool:", e);
}

export const db = (pool! || {
  query: async (...args: any[]) => { throw new Error(`Database not configured (URL: ${databaseUrl ? 'Present' : 'Missing'})`); },
  connect: async () => { throw new Error("Database not configured"); },
  on: () => {},
  end: async () => {},
}) as unknown as Pool;


const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log("Adding is_banned column to customers...");
    await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE");
    
    console.log("Adding is_banned column to provider_requests...");
    await pool.query("ALTER TABLE provider_requests ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE");

    console.log("Done!");
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();

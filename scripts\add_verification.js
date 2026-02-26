const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log("Connected to DB...");

    // Providers
    console.log("Updating provider_requests...");
    await client.query(`ALTER TABLE provider_requests ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE provider_requests ADD COLUMN IF NOT EXISTS verification_token TEXT`);

    // Customers
    // First ensure table exists (it should, but just in case)
    console.log("Updating customers...");
    // Note: checking if customers table exists first might be good, but ALTER IF EXISTS is not standard PG for columns on missing table.
    // Assuming customers table exists based on login route.
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`);
    await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS verification_token TEXT`);

    console.log("Done!");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run();

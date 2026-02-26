const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
// Also try .env if .env.local doesn't exist or doesn't have the var
require('dotenv').config({ path: '.env' });

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is missing");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB");
    
    // Check if column exists
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'provider_requests' AND column_name = 'freelance_license_file'
    `);

    if (res.rows.length === 0) {
      console.log("Adding freelance_license_file column...");
      await client.query(`
        ALTER TABLE provider_requests 
        ADD COLUMN freelance_license_file TEXT;
      `);
      console.log("Column added successfully.");
    } else {
      console.log("Column already exists.");
    }

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

run();

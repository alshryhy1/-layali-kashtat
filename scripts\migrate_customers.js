
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  let dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    try {
      const envPath = path.resolve(__dirname, '../.env.local');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=(.+)/);
        if (match && match[1]) {
          dbUrl = match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch (e) {
      console.log('Could not read .env.local');
    }
  }

  if (!dbUrl) {
    // Fallback to .env if .env.local fails or doesn't have it
     try {
      const envPath = path.resolve(__dirname, '../.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL=(.+)/);
        if (match && match[1]) {
          dbUrl = match[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    } catch (e) {}
  }

  if (!dbUrl) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    console.log('Creating customers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        phone VARCHAR(50) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name VARCHAR(100),
        email VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('Adding customer_id to customer_requests...');
    await client.query(`
      ALTER TABLE customer_requests 
      ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
    `);

    console.log('Creating index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_customer_requests_customer_id ON customer_requests(customer_id);
    `);

    console.log('Migration complete successfully');

  } catch (err) {
    console.error('Error migrating:', err);
  } finally {
    await client.end();
  }
}

migrate();


const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function createTable() {
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

    const query = `
      CREATE TABLE IF NOT EXISTS customer_requests (
        id SERIAL PRIMARY KEY,
        ref VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        completed BOOLEAN DEFAULT false,
        group_type VARCHAR(50),
        people_count VARCHAR(50),
        cooking VARCHAR(50),
        equip VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await client.query(query);
    console.log('Table customer_requests created successfully');

  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await client.end();
  }
}

createTable();

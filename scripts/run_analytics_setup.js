const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'setup_analytics.sql'), 'utf8');
    await pool.query(sql);
    console.log('Analytics table created successfully.');
  } catch (e) {
    console.error('Error creating analytics table:', e);
  } finally {
    await pool.end();
  }
}

run();

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.aslnkubwrdvtmlntfaee:Assan31225assan31225@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');

    const sqlPath = path.join(__dirname, 'enable_realtime.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL...');
    await client.query(sql);
    console.log('SQL executed successfully');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();

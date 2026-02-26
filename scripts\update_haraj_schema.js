const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'haraj_items'
    `);
    console.log('Columns:', res.rows.map(r => r.column_name));
    
    // Add column if not exists
    if (!res.rows.find(r => r.column_name === 'delete_code')) {
      console.log('Adding delete_code column...');
      await client.query('ALTER TABLE haraj_items ADD COLUMN delete_code VARCHAR(50)');
      console.log('Column added.');
    } else {
      console.log('delete_code column already exists.');
    }
    
  } catch (e) { console.error(e); } 
  finally { await client.end(); }
}

run();

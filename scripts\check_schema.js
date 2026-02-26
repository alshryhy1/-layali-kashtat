const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_requests'
    `);
    console.log(res.rows.map(r => r.column_name));
  } catch (e) { console.error(e); } 
  finally { await client.end(); }
}
checkSchema();

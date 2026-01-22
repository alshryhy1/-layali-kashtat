const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    console.log('Deleting all items from haraj_items...');
    const res = await client.query('DELETE FROM haraj_items');
    console.log(`Deleted ${res.rowCount} items.`);
    
  } catch (e) { console.error(e); } 
  finally { await client.end(); }
}

run();

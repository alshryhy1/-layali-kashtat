const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    // Check if column exists
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'haraj_items' AND column_name = 'listing_type'
    `);
    
    if (res.rows.length === 0) {
      console.log('Adding listing_type column...');
      await client.query(`
        ALTER TABLE haraj_items 
        ADD COLUMN listing_type VARCHAR(20) DEFAULT 'sell';
      `);
      console.log('Column listing_type added.');
      
      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_haraj_items_listing_type ON haraj_items(listing_type);
      `);
      console.log('Index created.');
    } else {
      console.log('listing_type column already exists.');
    }
    
  } catch (e) { console.error(e); } 
  finally { await client.end(); }
}

run();

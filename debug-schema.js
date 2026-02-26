
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/layali_kashtat',
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'provider_requests';
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run().catch(console.error);

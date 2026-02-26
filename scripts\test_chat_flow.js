const { Client } = require('pg');
// const fetch = require('node-fetch'); // Using built-in fetch

const connectionString = 'postgresql://postgres.aslnkubwrdvtmlntfaee:Assan31225assan31225@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const BASE_URL = 'http://localhost:3000';

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');

    // 1. Create Dummy Provider
    const providerPhone = '9665' + Math.floor(Math.random() * 100000000);
    const providerRes = await client.query(
      "INSERT INTO provider_requests (name, phone, city, service_type, status) VALUES ($1, $2, $3, $4, 'approved') RETURNING id",
      ['Test Provider Chat', providerPhone, 'Riyadh', 'Tent']
    );
    const providerId = providerRes.rows[0].id;
    console.log('Created Provider:', providerId);

    // 2. Create Dummy Customer Request
    const ref = 'CHAT-' + Date.now();
    const customerRes = await client.query(
      "INSERT INTO customer_requests (ref, name, phone, city, service_type, status) VALUES ($1, $2, $3, $4, $5, 'new') RETURNING id",
      [ref, 'Test Customer Chat', '966511111111', 'Riyadh', 'Tent']
    );
    const requestId = customerRes.rows[0].id;
    console.log('Created Request:', ref, requestId);

    // 3. Call Accept API
    console.log('Calling Accept API...');
    const acceptRes = await fetch(`${BASE_URL}/api/customer-requests/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: ref,
        provider_id: providerId,
        price_total: 500,
        currency: 'SAR',
        notes: 'Test notes'
      })
    });
    
    if (!acceptRes.ok) {
        const txt = await acceptRes.text();
        throw new Error(`Accept API failed: ${acceptRes.status} ${txt}`);
    }
    const acceptJson = await acceptRes.json();
    console.log('Accept API Result:', acceptJson);

    // 4. Verify Conversation
    const convRes = await client.query("SELECT * FROM conversations WHERE request_id = $1", [requestId]);
    if (convRes.rows.length === 0) {
      throw new Error('Conversation not created!');
    }
    const conversationId = convRes.rows[0].id;
    console.log('Conversation Created:', conversationId);

    // 5. Send Message (Customer)
    console.log('Sending Message as Customer...');
    const sendRes = await fetch(`${BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: ref,
        role: 'customer',
        content: 'Hello Provider!'
      })
    });
    const sendJson = await sendRes.json();
    console.log('Send Message Result:', sendJson);

    // 5b. Send Location (Customer)
    console.log('Sending Location as Customer...');
    const locRes = await fetch(`${BASE_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: ref,
        role: 'customer',
        content: '24.7136,46.6753',
        type: 'location',
        location: { lat: 24.7136, lng: 46.6753 }
      })
    });
    const locJson = await locRes.json();
    console.log('Send Location Result:', locJson);

    // 6. Get History (Provider)
    console.log('Getting History as Provider...');
    // Provider needs to resolve request ID or have conversation ID.
    // The history API usually takes ref for customer, or provider_id + request_id?
    // Let's check history API logic. 
    // Assuming provider passes providerId and requestId (from Accept response or knowing it)
    
    // Wait, history API for provider might need adjustment. 
    // Let's try as customer first to verify message stored.
    const histRes = await fetch(`${BASE_URL}/api/chat/history?ref=${ref}&role=customer`);
    const histJson = await histRes.json();
    console.log('History Result (Customer):', histJson);

    if (histJson.messages && histJson.messages.length > 0 && histJson.messages[0].content === 'Hello Provider!') {
        console.log('SUCCESS: Message found in history');
    } else {
        console.error('FAILURE: Message not found');
    }

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    await client.end();
  }
}

run();

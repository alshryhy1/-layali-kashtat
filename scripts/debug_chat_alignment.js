const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function debugChat() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    // 1. Find request by Ref
    const ref = 'LK-875669';
    const reqRes = await client.query("SELECT * FROM customer_requests WHERE ref = $1", [ref]);
    
    if (reqRes.rows.length === 0) {
      console.log("Request not found");
      return;
    }
    const request = reqRes.rows[0];
    console.log("Request:", request.id, request.ref);

    // 2. Find conversation
    // Assuming conversation is linked by request_id? Or how?
    // Let's check conversations table schema
    const convRes = await client.query("SELECT * FROM conversations WHERE request_id = $1", [request.id]);
    
    if (convRes.rows.length === 0) {
      console.log("No conversation found");
      return;
    }
    
    const conv = convRes.rows[0];
    console.log("Conversation:", conv.id);
    
    // 3. Get messages
    const msgRes = await client.query("SELECT id, sender_role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at", [conv.id]);
    
    console.log("Messages:");
    msgRes.rows.forEach(m => {
      console.log(`- [${m.sender_role}] ${m.content}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

debugChat();

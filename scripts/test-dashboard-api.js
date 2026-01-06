
async function getPg() {
  const mod = await import('pg');
  return mod.Client;
}
async function getCrypto() {
  const mod = await import('crypto');
  return mod;
}

async function run() {
  const Client = await getPg();
  const crypto = await getCrypto();
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // 1. Get a provider
    const pRes = await client.query("SELECT * FROM provider_requests WHERE status = 'approved' LIMIT 1");
    if (pRes.rows.length === 0) {
      console.log("No approved providers found.");
      return;
    }
    const provider = pRes.rows[0];
    console.log("Testing with provider:", provider.email, "City:", provider.city, "Services:", provider.service_type);

    // Insert a matching request if none exist
    const services = (provider.service_type || "").split(",").map(s => s.trim());
    const serviceToUse = services[0];
    const nowIso = new Date().toISOString();
    const ref = `LK-TEST-${Date.now()}`;
    
    await client.query(
      "INSERT INTO customer_requests (ref,name,phone,email,city,service_type,status,completed,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [ref, "Test Customer", "0500000000", "test@customer.com", provider.city, serviceToUse, "new", false, nowIso, nowIso]
    );
    console.log(`Inserted test request ${ref} for ${provider.city} - ${serviceToUse}`);

    // 2. Create session token (simulate what login route does)
    const SECRET = process.env.PROVIDER_SESSION_SECRET || "lk_provider_secret_123";
    const payload = JSON.stringify({ id: provider.id, email: provider.email });
    const base64Payload = Buffer.from(payload).toString("base64url");
    const signature = crypto.createHmac("sha256", SECRET).update(base64Payload).digest("hex");
    const token = `${base64Payload}.${signature}`;

    console.log("Generated Token:", token);

    // 3. Simulate Dashboard API call logic
    // We reuse 'services' defined above
    console.log("Provider Services:", services);
    console.log("Provider City:", provider.city);

    const reqRes = await client.query(
      "SELECT * FROM customer_requests WHERE city = $1 AND service_type = ANY($2) AND status IN ('new', 'pending') ORDER BY created_at DESC LIMIT 50",
      [provider.city, services]
    );

    console.log(`Found ${reqRes.rows.length} matching requests.`);
    reqRes.rows.forEach(r => {
      console.log(`- Ref: ${r.ref}, Service: ${r.service_type}, City: ${r.city}`);
    });

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();

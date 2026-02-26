
const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch if node 18+

async function run() {
  try {
    const res = await fetch('http://localhost:3000/api/providers/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "رحلات بريه",
        phone: "0534710749",
        service_type: "كشته بريه رمليه",
        city: "الرياض",
        password: "password123",
        accepted: true
      })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

run();

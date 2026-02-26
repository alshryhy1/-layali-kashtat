
async function testProvider() {
  try {
    const res = await fetch('http://localhost:3000/api/providers/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        phone: '0500000004',
        password: 'password123',
        name: 'Test Provider No Email',
        city: 'Riyadh',
        service_type: 'Camp',
        accepted: true
        })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Data:', data);
  } catch (e) {
    console.error(e);
  }
}

testProvider();

const http = require('http');

const url = 'http://localhost:3000/ar/haraj';

console.log(`Checking ${url}...`);

http.get(url, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Route is accessible.');
      
      // Check for key content
      if (data.includes('حراج ليالي كشتات') || data.includes('Layali Kashtat Marketplace')) {
        console.log('✅ Page title found');
      } else {
        console.error('❌ Page title not found');
      }

      if (data.includes('عمولة 1%') || data.includes('1% commission')) {
        console.log('✅ Commission banner found');
      } else {
        console.error('❌ Commission banner not found');
      }
    } else {
      console.log(`❌ Failed to access route. Status: ${res.statusCode}`);
    }
  });

}).on('error', (err) => {
  console.log('❌ Error: ' + err.message);
});

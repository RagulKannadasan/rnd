// Test if we can access the backend server
const http = require('http');

console.log('Testing backend server access...');

// Test the health endpoint
const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Server responded with status code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ Health check response:', jsonData);
    } catch (error) {
      console.log('Response data:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Connection error:', error.message);
  console.log('Troubleshooting steps:');
  console.log('1. Make sure the backend server is running (npm run server)');
  console.log('2. Check if port 5001 is not blocked by firewall');
  console.log('3. Verify that localhost resolves correctly');
});

req.end();
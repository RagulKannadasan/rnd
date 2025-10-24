// Test script to check if we can connect to the backend server
const http = require('http');

console.log('Testing connection to backend server on port 5001...');

// Test 1: Check if server is listening
const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Server responded with status code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    console.log('Response data:', chunk.toString());
  });
  
  res.on('end', () => {
    console.log('✅ Connection test completed successfully');
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

// Test 2: Simple port check
const portCheck = http.get(`http://localhost:5001/api/health`, (res) => {
  console.log(`✅ Port check successful: ${res.statusCode}`);
}).on('error', (err) => {
  console.log('❌ Port check failed:', err.message);
});
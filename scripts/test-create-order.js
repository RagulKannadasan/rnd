// Test script to verify the create-order endpoint
const http = require('http');

console.log('Testing create-order endpoint...');

// Test data
const testData = {
  amount: 10000, // 100 INR in paise
  currency: 'INR',
  eventId: 'test_event_001',
  userId: 'test_user_123',
  eventName: 'Test Event'
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/create-order',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Server responded with status code: ${res.statusCode}`);
  console.log('Response headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response data type:', typeof data);
    console.log('Response data length:', data.length);
    
    // Check if it's JSON
    if (data.startsWith('{') || data.startsWith('[')) {
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ JSON response:', jsonData);
      } catch (error) {
        console.log('❌ Failed to parse as JSON:', error.message);
        console.log('Response content (first 500 chars):', data.substring(0, 500));
      }
    } else {
      console.log('❌ Non-JSON response received (first 500 chars):', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request error:', error.message);
});

req.write(postData);
req.end();
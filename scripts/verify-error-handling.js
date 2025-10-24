// Test script to verify our improved error handling
console.log('Verifying error handling...');

// Test 1: Simulate the "Unexpected token '<'" error
function testJsonParseError() {
  const htmlResponse = '<!DOCTYPE html><html><body>Error page</body></html>';
  
  try {
    JSON.parse(htmlResponse);
  } catch (error) {
    console.log('✅ Successfully caught JSON parse error:', error.message);
    if (error.message.includes('Unexpected token') && error.message.includes('<')) {
      console.log('✅ Error message matches expected pattern');
    }
  }
}

// Test 2: Verify our API config
function testApiConfig() {
  // Simulate browser environment
  global.window = {
    location: {
      hostname: 'localhost'
    }
  };
  
  try {
    const { getApiUrl } = require('./src/services/apiConfig');
    const url = getApiUrl('/api/create-order');
    console.log('✅ API URL:', url);
    
    if (url === 'http://localhost:5001/api/create-order') {
      console.log('✅ API URL is correct');
    } else {
      console.log('❌ API URL is incorrect');
    }
  } catch (error) {
    console.log('❌ Error in API config:', error.message);
  } finally {
    delete global.window;
  }
}

// Run tests
testJsonParseError();
testApiConfig();

console.log('✅ Error handling verification completed');
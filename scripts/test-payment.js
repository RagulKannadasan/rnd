// Simple test script to verify payment integration
async function testPayment() {
  try {
    console.log('Testing payment integration...');
    
    const response = await fetch('http://localhost:5001/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend health check successful:', data);
    } else {
      console.log('❌ Backend health check failed:', response.status, response.statusText);
    }
    
    // Test key verification
    const keyResponse = await fetch('http://localhost:5001/api/test-keys', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (keyResponse.ok) {
      const keyData = await keyResponse.json();
      console.log('✅ Key verification:', keyData);
    } else {
      console.log('❌ Key verification failed:', keyResponse.status, keyResponse.statusText);
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

testPayment();
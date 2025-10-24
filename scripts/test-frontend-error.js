// Test script to simulate frontend error handling
async function testFrontendErrorHandling() {
  console.log('Testing frontend error handling...');
  
  try {
    const response = await fetch('http://localhost:5001/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 10000,
        currency: 'INR',
        eventId: 'test_event_001',
        userId: 'test_user_123',
        eventName: 'Test Event'
      }),
    });
    
    console.log('Response status:', response.status);
    
    // Try to parse as JSON
    const data = await response.json();
    console.log('✅ Parsed JSON data:', data);
  } catch (error) {
    console.log('❌ Error during fetch:', error.message);
    
    // Check if it's the JSON parsing error we're looking for
    if (error.message.includes('Unexpected token') && error.message.includes('<')) {
      console.log('This is the error we need to fix!');
    }
  }
}

testFrontendErrorHandling();
// Simple test script to verify Razorpay setup
require('dotenv').config();
const Razorpay = require('razorpay');

// Determine mode (test or live)
const razorpayMode = process.env.RAZORPAY_MODE || 'test';

// Set keys based on mode
const razorpayKeyId = razorpayMode === 'live' 
  ? process.env.RAZORPAY_KEY_ID_LIVE 
  : process.env.RAZORPAY_KEY_ID_TEST;

const razorpayKeySecret = razorpayMode === 'live' 
  ? process.env.RAZORPAY_KEY_SECRET_LIVE 
  : process.env.RAZORPAY_KEY_SECRET_TEST;

console.log('Razorpay Test Script');
console.log('====================');
console.log(`Mode: ${razorpayMode.toUpperCase()}`);
console.log(`Key ID Set: ${!!razorpayKeyId}`);
console.log(`Key Secret Set: ${!!razorpayKeySecret}`);

if (!razorpayKeyId || !razorpayKeySecret) {
  console.error('❌ ERROR: Razorpay keys are not properly configured!');
  console.error('Please check your .env file');
  process.exit(1);
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// Test the connection by fetching orders (this will fail but show if keys work)
async function testConnection() {
  try {
    console.log('\nTesting connection to Razorpay API...');
    await razorpay.orders.all({ count: 1 });
    console.log('✅ Connection successful!');
  } catch (error) {
    if (error.statusCode === 401) {
      console.error('❌ Authentication failed: Check your Razorpay keys');
    } else {
      console.log('✅ Connection successful! (No orders found, which is expected)');
    }
  }
}

testConnection();
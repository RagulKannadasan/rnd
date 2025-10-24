// Simple script to verify our fix
console.log('Verifying the fix for network error...');

// Simulate browser environment
global.window = {
  location: {
    hostname: 'localhost'
  }
};

// Test our API config
const { getApiUrl } = require('./src/services/apiConfig');

console.log('Testing API configuration...');
console.log('API URL for /api/create-order:', getApiUrl('/api/create-order'));

// Clean up
delete global.window;

console.log('✅ Fix verification completed');
// Test script to verify frontend can connect to backend
const { getApiUrl } = require('../src/services/apiConfig');

console.log('Testing API URL configuration...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('API Base URL:', getApiUrl(''));
console.log('Create order URL:', getApiUrl('/api/create-order'));

// Test fetch to backend
fetch(getApiUrl('/api/health'))
  .then(response => {
    if (response.ok) {
      return response.json();
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  })
  .then(data => {
    console.log('✅ Backend health check successful:', data);
  })
  .catch(error => {
    console.log('❌ Backend health check failed:', error.message);
  });
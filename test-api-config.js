// Test script to verify API configuration
const fs = require('fs');

// Read the apiConfig.js file content
const apiConfigContent = fs.readFileSync('./src/services/apiConfig.js', 'utf8');

// Extract and test the isDevelopment function logic
console.log('Testing API configuration logic...');

// Simulate browser environment
global.window = {
  location: {
    hostname: 'localhost'
  }
};

console.log('Window location hostname:', global.window.location.hostname);

// Test the isDevelopment logic directly
const isDevelopment = () => {
  // Check if we're running on localhost or 127.0.0.1
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.startsWith('192.168.') || // Common local network IPs
           window.location.hostname.startsWith('10.'); // Common local network IPs
  }
  
  // For Node.js environment
  return process.env.NODE_ENV === 'development';
};

console.log('Is development:', isDevelopment());

// Test getApiBaseUrl logic
const getApiBaseUrl = () => {
  // In development, use localhost with the correct port (5001)
  if (isDevelopment()) {
    return 'http://localhost:5001';
  }
  
  // In production, use the same origin (relative URLs)
  // This assumes the backend is served from the same domain
  return '';
};

console.log('Base URL:', getApiBaseUrl());

// Test getApiUrl logic
const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  
  // If baseUrl is empty (production), return relative URL
  if (!baseUrl) {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  
  // In development, combine base URL with endpoint
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

console.log('API URL for /api/create-order:', getApiUrl('/api/create-order'));
console.log('API URL for /api/health:', getApiUrl('/api/health'));
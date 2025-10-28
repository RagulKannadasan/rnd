// API Configuration utility
// In browser environment, we need to detect development vs production differently

// Determine if we're in development based on the hostname
const isDevelopment = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' ||
           hostname === '127.0.0.1' ||
           hostname.startsWith('192.168.') ||
           hostname.startsWith('10.') ||
           hostname.endsWith('.cloudworkstations.dev'); // Recognize cloud workstations
  }
  
  // For Node.js environment
  return process.env.NODE_ENV === 'development';
};

// Determine the correct API base URL based on environment
export const getApiBaseUrl = () => {
  if (isDevelopment()) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // For Cloud Workstations, construct the URL with the correct port
    if (hostname.endsWith('.cloudworkstations.dev')) {
      // Replace the frontend port prefix (e.g., '3000-') with the backend port prefix '5001-'
      const backendHostname = hostname.replace(/^\d+-/, '5001-');
      return `${protocol}//${backendHostname}`;
    }
    
    // For local network, use the same IP as frontend with the backend port
    if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return `http://${hostname}:5001`;
    }
    
    // Default to localhost for local development
    return 'http://localhost:5001';
  }
  
  // In production, use the same origin (relative URLs)
  // This assumes the backend is served from the same domain
  return '';
};


// Get the full API URL for a specific endpoint
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  
  // If baseUrl is empty (production), return relative URL
  if (!baseUrl) {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  
  // In development, combine base URL with endpoint
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Create a default export object
const apiConfig = {
  getApiBaseUrl,
  getApiUrl
};

export default apiConfig;
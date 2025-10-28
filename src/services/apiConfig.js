
// API Configuration utility

// In all environments, we'll now use a relative path
// The proxy middleware will handle redirecting this to the backend server
export const getApiBaseUrl = () => {
  return '';
};

// Get the full API URL for a specific endpoint
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  
  if (!baseUrl) {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  
  return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Create a default export object
const apiConfig = {
  getApiBaseUrl,
  getApiUrl
};

export default apiConfig;

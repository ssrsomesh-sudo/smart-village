// src/utils/api.js
export const apiRequest = async (url, options = {}) => {
  const token = sessionStorage.getItem('smart_village_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  return response;
};
// ========================================
// CREATE NEW FILE: frontend/src/config/api.js
// ========================================

/**
 * API Configuration
 * Single source of truth for API URL
 * Change once, applies everywhere!
 */

// 🚂 Railway API URL (REPLACE WITH YOUR ACTUAL URL)
export const API_URL = 'https://smart-village-production.up.railway.app';

// Replace 'xxxx' with your actual Railway subdomain
// Example: https://smart-village-production-a1b2c3d4.up.railway.app

// For development, you can use:
// export const API_URL = process.env.NODE_ENV === 'development'
//   ? 'http://localhost:4000'
//   : 'https://your-railway-url.up.railway.app';

export default API_URL;
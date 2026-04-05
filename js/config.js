/**
 * Frontend Configuration
 * Sets API_BASE from window object or uses default
 */

// Try to load from window.VITE_API_BASE (injected by HTML or build process)
// Otherwise use default
window.API_BASE = 'https://webbantruyen-backend-latest.onrender.com';

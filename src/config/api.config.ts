/**
 * API Configuration
 * Central configuration for backend API endpoints
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
  },
  
  // Onboarding endpoints
  ONBOARDING: {
    COMPLETE: '/onboarding/complete',
  },
  
  // Activation endpoints
  ACTIVATION: {
    VALIDATE: (token: string) => `/activation/validate/${token}`,
    ACTIVATE: '/activation/activate',
  },
  
  // Profile endpoints
  PROFILES: {
    ME: '/profiles/me',
    FAMILY: '/profiles/family',
  },
  
  // Services endpoints
  SERVICES: {
    LIST: '/services',
  },

  // Admin endpoints
  ADMIN: {
    SUBSCRIPTION_TYPES: '/admin/subscription-types',
    SERVICES: '/admin/services',
    MEMBERSHIPS: '/admin/memberships',
    SERVICE_PLANS: '/admin/service-plans',
    MEMBERSHIP_PLANS: '/admin/membership-plans',
  }
} as const;

/**
 * Helper function to build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * API Service
 * Central service for making API calls to the backend
 */

import { API_ENDPOINTS, buildApiUrl } from '../config/api.config';
import type {
  LoginRequest,
  LoginResponse,
  OnboardingRequest,
  OnboardingResponse,
  ActivationValidateResponse,
  ActivationActivateRequest,
  ActivationActivateResponse,
  ProfileMeResponse,
  ProfileFamilyResponse,
  ServicesListResponse,
  ApiError,
} from '../types/api.types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

/**
 * Set auth token in localStorage
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

/**
 * Remove auth token from localStorage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('accessToken');
};

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge with options headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse response
    const data = await response.json();

    // Handle error responses
    if (!response.ok) {
      const error: ApiError = {
        error: data.error || 'API Error',
        message: data.message || 'An error occurred',
        statusCode: response.status,
      };
      throw error;
    }

    return data as T;
  } catch (error) {
    // Re-throw API errors
    if ((error as ApiError).statusCode) {
      throw error;
    }

    // Handle network errors
    throw {
      error: 'Network Error',
      message: 'Failed to connect to the server',
      statusCode: 0,
    } as ApiError;
  }
}

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiFetch<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );

    // Store token after successful login
    if (response.accessToken) {
      setAuthToken(response.accessToken);
    }

    return response;
  },

  /**
   * Logout (clear local token)
   */
  logout(): void {
    removeAuthToken();
  },
};

// ============================================================================
// Onboarding API
// ============================================================================

export const onboardingApi = {
  /**
   * Complete onboarding process
   */
  async complete(data: OnboardingRequest): Promise<OnboardingResponse> {
    return apiFetch<OnboardingResponse>(
      API_ENDPOINTS.ONBOARDING.COMPLETE,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },
};

// ============================================================================
// Activation API
// ============================================================================

export const activationApi = {
  /**
   * Validate activation token
   */
  async validate(token: string): Promise<ActivationValidateResponse> {
    return apiFetch<ActivationValidateResponse>(
      API_ENDPOINTS.ACTIVATION.VALIDATE(token),
      {
        method: 'GET',
      }
    );
  },

  /**
   * Activate profile with password
   */
  async activate(data: ActivationActivateRequest): Promise<ActivationActivateResponse> {
    return apiFetch<ActivationActivateResponse>(
      API_ENDPOINTS.ACTIVATION.ACTIVATE,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },
};

// ============================================================================
// Profile API
// ============================================================================

export const profileApi = {
  /**
   * Get current logged-in profile
   */
  async getMe(): Promise<ProfileMeResponse> {
    return apiFetch<ProfileMeResponse>(
      API_ENDPOINTS.PROFILES.ME,
      {
        method: 'GET',
      }
    );
  },

  /**
   * Get all family members
   */
  async getFamily(): Promise<ProfileFamilyResponse> {
    return apiFetch<ProfileFamilyResponse>(
      API_ENDPOINTS.PROFILES.FAMILY,
      {
        method: 'GET',
      }
    );
  },
};

// ============================================================================
// Services API
// ============================================================================

export const servicesApi = {
  /**
   * Get all services
   */
  async list(): Promise<ServicesListResponse> {
    const data = await apiFetch<any>(
      API_ENDPOINTS.SERVICES.LIST,
      {
        method: 'GET',
      }
    );

    // Handle direct array response from backend and map fields
    if (Array.isArray(data)) {
        return {
            services: data.map((item: any) => ({
                ...item,
                id: item.service_id,   // Map for compatibility
                name: item.service_name // Map for compatibility
            }))
        };
    }

    return data;
  },
};

// ============================================================================
// Export all APIs
// ============================================================================

export const api = {
  auth: authApi,
  onboarding: onboardingApi,
  activation: activationApi,
  profile: profileApi,
  services: servicesApi,
};

export default api;

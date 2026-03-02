const getBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
  }
  return 'http://localhost:3001/api/v1';
};

const API_BASE_URL = getBaseUrl();
const TOKEN_KEY = 'token';

/**
 * Get the current auth token from storage
 */
export const getToken = () => {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * Set the auth token to storage
 */
export const setToken = (token: string) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Remove the auth token from storage
 */
export const removeToken = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Clear all authentication data from storage
 */
export const clearAuth = () => {
  if (typeof localStorage !== 'undefined') {
    const keysToRemove = ['token', 'role', 'loginId', 'userParams', 'currentLocationId', 'locations'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};

/**
 * Manually decode JWT payload without external libraries
 */
const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

/**
 * Base fetch wrapper that handles headers and errors
 */
const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  // Pre-check: Token Expiration (First Layer of Security)
  if (token) {
    const decoded = decodeToken(token);
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    
    if (decoded && decoded.exp && decoded.exp < now) {
      console.warn("Token expired (pre-check), redirecting...");
      clearAuth();
      window.location.href = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
      return null;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Include the current location ID for backend filtering and tenant isolation
  const currentLocationId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentLocationId') : null;
  if (currentLocationId) {
    headers['x-location-id'] = currentLocationId;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    // Attempt to parse error message from body
    let errorMessage = 'An error occurred';
    let errorStatus = response.status;
    
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
      
      // Handle Token Expiration (403 Forbidden with specific message)
      if (errorStatus === 403 && errorMessage === 'Invalid or expired token') {
        clearAuth();
        // Force a page reload to reset the application state and trigger redirects in AppRoutes
        window.location.href = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
        return null;
      }
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  // Allow for 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const apiClient = {
  get: (endpoint: string, queryParams: any = {}, options: RequestInit = {}) => {
    const query = new URLSearchParams(queryParams).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return request(url, { method: 'GET', ...options });
  },
  
  post: (endpoint: string, body: any, options: RequestInit = {}) => {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  },

  put: (endpoint: string, body: any, options: RequestInit = {}) => {
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  },

  patch: (endpoint: string, body: any, options: RequestInit = {}) => {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    });
  },

  delete: (endpoint: string, options: RequestInit = {}) => {
    return request(endpoint, { method: 'DELETE', ...options });
  },

  upload: async (endpoint: string, formData: FormData, options: RequestInit = {}) => {
    const token = getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Include the current location ID for backend filtering and tenant isolation
    const currentLocationId = typeof localStorage !== 'undefined' ? localStorage.getItem('currentLocationId') : null;
    if (currentLocationId) {
      headers['x-location-id'] = currentLocationId;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch {
            errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
    }
    return response.json();
  }
};

const getBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
  }
  return 'http://localhost:3001/api/v1';
};

const API_BASE_URL = getBaseUrl();
const TOKEN_KEY = 'solarswim_token';

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
 * Base fetch wrapper that handles headers and errors
 */
const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    // Attempt to parse error message from body
    let errorMessage = 'An error occurred';
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
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

  delete: (endpoint: string, options: RequestInit = {}) => {
    return request(endpoint, { method: 'DELETE', ...options });
  },
};

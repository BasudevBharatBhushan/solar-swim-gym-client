const getBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
  }
  return 'http://localhost:3001/api/v1';
};

const API_BASE_URL = getBaseUrl();
const TOKEN_KEY = 'token';
type QueryParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Get the current auth token from storage
 */
export const getToken = () => {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * Set the auth token to storage
 */
export const setToken = (token: string) => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Remove the auth token from storage
 */
export const removeToken = () => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Base fetch wrapper that handles headers and errors
 */
const request = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
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
    return null as T;
  }

  return response.json() as Promise<T>;
};

export const apiClient = {
  get: <T = unknown>(endpoint: string, queryParams: QueryParams = {}, options: RequestInit = {}) => {
    const stringParams = Object.entries(queryParams).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
    const query = new URLSearchParams(stringParams).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return request<T>(url, { method: 'GET', ...options });
  },
  
  post: <T = unknown>(endpoint: string, body: unknown, options: RequestInit = {}) => {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  },

  put: <T = unknown>(endpoint: string, body: unknown, options: RequestInit = {}) => {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  },

  patch: <T = unknown>(endpoint: string, body: unknown, options: RequestInit = {}) => {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    });
  },

  delete: <T = unknown>(endpoint: string, options: RequestInit = {}) => {
    return request<T>(endpoint, { method: 'DELETE', ...options });
  },

  upload: async <T = unknown>(endpoint: string, formData: FormData, options: RequestInit = {}): Promise<T> => {
    const token = getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
    return response.json() as Promise<T>;
  }
};

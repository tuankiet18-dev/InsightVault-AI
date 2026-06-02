export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5126/api';

export interface ApiErrorResponse {
  errorCode: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  public status: number;
  public errorCode: string;
  public details?: Record<string, unknown>;

  constructor(status: number, errorData: ApiErrorResponse) {
    super(errorData.message || 'An unexpected error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorData.errorCode || 'unknown_error';
    this.details = errorData.details;
  }
}

/**
 * Gets the JWT token.
 * Adjust this if you move to a different storage mechanism (e.g., Zustand store).
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Sets the JWT token.
 */
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

/**
 * Clears the JWT token.
 */
export const clearToken = (): void => {
  localStorage.removeItem('token');
};

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * Base fetch function with JWT injection and standard error handling.
 */
export const fetchApi = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
  const { params, headers, ...customOptions } = options;

  const token = getToken();

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Construct URL with query params if any
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
    ...customOptions,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  // Handle No Content
  if (response.status === 204) {
    return {} as T;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');

  if (!response.ok) {
    let errorData: ApiErrorResponse = {
      errorCode: 'request_failed',
      message: response.statusText,
    };

    if (isJson) {
      try {
        const parsedError = await response.json();
        if (parsedError && typeof parsedError === 'object') {
          errorData = { ...errorData, ...parsedError };
        }
      } catch (e) {
        console.error('Failed to parse error response JSON', e);
      }
    } else {
      const text = await response.text();
      errorData.message = text || response.statusText;
    }

    throw new ApiError(response.status, errorData);
  }

  if (isJson) {
    return response.json();
  }

  return response.text() as unknown as T;
};

// Convenience methods
export const http = {
  get: <T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method'>) =>
    fetchApi<T>(endpoint, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method'>) =>
    fetchApi<T>(endpoint, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method'>) =>
    fetchApi<T>(endpoint, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};

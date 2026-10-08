import { ApiError, ApiResponse } from '../../types/common';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiClient {
  private static getAccessToken(): string | null {
    return localStorage.getItem('aegis_access_token');
  }

  private static getRefreshToken(): string | null {
    return localStorage.getItem('aegis_refresh_token');
  }

  public static setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('aegis_access_token', accessToken);
    localStorage.setItem('aegis_refresh_token', refreshToken);
  }

  public static clearTokens() {
    localStorage.removeItem('aegis_access_token');
    localStorage.removeItem('aegis_refresh_token');
    localStorage.removeItem('aegis_user');
  }

  public static async request<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, any> } = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    let url = endpoint;
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      if (endpoint.startsWith('/api/v1')) {
        const baseUrlNoPath = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
        url = `${baseUrlNoPath}${endpoint}`;
      } else {
        const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const cleanEp = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        url = `${cleanBase}${cleanEp}`;
      }
    }
    if (params) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
      const queryString = query.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers,
    };

    let response = await fetch(url, config);

    // If 401 Unauthorized, try refreshing token once if refresh token exists
    if (response.status === 401 && this.getRefreshToken() && !endpoint.includes('/auth/')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
        response = await fetch(url, { ...fetchOptions, headers });
      } else {
        this.clearTokens();
        window.dispatchEvent(new Event('globalshield:auth:unauthorized'));
      }
    }

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          timestamp: new Date().toISOString(),
          status: response.status,
          error: response.statusText,
          message: `Request failed with status ${response.status}`,
          path: endpoint,
        };
      }
      throw errorData;
    }

    const body: any = await response.json();
    if (body !== null && typeof body === 'object' && 'data' in body && ('success' in body || 'message' in body)) {
      return body.data;
    }
    return body as T;
  }

  private static async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const body = await response.json();
      if (body.success && body.data) {
        this.setTokens(body.data.accessToken, body.data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public static get<T>(endpoint: string, options?: RequestInit & { params?: Record<string, any> }): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  public static post<T>(endpoint: string, body?: any, options?: RequestInit & { params?: Record<string, any> }): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  public static put<T>(endpoint: string, body?: any, options?: RequestInit & { params?: Record<string, any> }): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  public static patch<T>(endpoint: string, body?: any, options?: RequestInit & { params?: Record<string, any> }): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  }

  public static delete<T>(endpoint: string, options?: RequestInit & { params?: Record<string, any> }): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options });
  }
}

export default ApiClient;
export { ApiClient as client, ApiClient as apiClient };

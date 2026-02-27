import { ApiResponse } from '@/types/file-system';

/**
 * Core API Client for unified request handling
 */
export class ApiClient {
  private static async request<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      // Handle standard ApiResponse structure
      if (typeof json === 'object' && json !== null && 'success' in json && typeof (json as any).success === 'boolean') {
        const apiResponse = json as ApiResponse<T>;
        if (!apiResponse.success) {
          throw new Error(apiResponse.error || apiResponse.message || 'Unknown API error');
        }
        // If data is present, return it. Otherwise return the whole response or null depending on T
        return apiResponse.data as T;
      }

      // Fallback for non-standard responses
      return json as T;
    } catch (error) {
      console.error(`API Request failed: ${url}`, error);
      throw error;
    }
  }

  static async get<T>(url: string): Promise<T> {
    return this.request<T>(url, { method: 'GET' });
  }

  static async post<T>(url: string, body?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  static async put<T>(url: string, body?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  static async delete<T>(url: string, body?: any): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

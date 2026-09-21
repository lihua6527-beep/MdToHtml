import { ApiResponse } from '@/types/file-system';
import { ErrorHandler, AppError } from './ErrorHandler';

/**
 * API Client configuration
 */
interface ApiClientConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Core API Client for unified request handling
 */
export class ApiClient {
  private static readonly DEFAULT_CONFIG: ApiClientConfig = {
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000 // 1 second
  };

  /**
   * Request with timeout and retry functionality
   */
  private static async request<T>(
    url: string, 
    options?: RequestInit, 
    config: ApiClientConfig = {}
  ): Promise<T> {
    const mergedConfig = { ...this.DEFAULT_CONFIG, ...config };
    let lastError: any;

    for (let attempt = 0; attempt < mergedConfig.retries!; attempt++) {
      try {
        // Create abort controller for timeout and cancellation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), mergedConfig.timeout);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const error = ErrorHandler.handleApiError(response);
            console.error(`API Request failed: ${url} (${response.status})`, error);
            throw error;
          }

          // Handle empty response
          if (response.status === 204) {
            return {} as T;
          }

          // Parse response based on content type
          const contentType = response.headers.get('content-type');
          let data;

          if (contentType?.includes('application/json')) {
            data = await response.json();
          } else if (contentType?.includes('text/')) {
            data = await response.text();
          } else {
            data = await response.blob();
          }

          // Handle standard ApiResponse structure
          if (typeof data === 'object' && data !== null && 'success' in data && typeof (data as any).success === 'boolean') {
            const apiResponse = data as ApiResponse<T>;
            if (!apiResponse.success) {
              const error = ErrorHandler.handleApiError(new Error(apiResponse.error || apiResponse.message || 'Unknown API error'));
              console.error(`API Request failed: ${url}`, error);
              throw error;
            }
            // If data is present, return it. Otherwise return the whole response
            if ('data' in apiResponse && apiResponse.data !== undefined) {
              return apiResponse.data as T;
            } else {
              return data as T;
            }
          }

          // Fallback for non-standard responses
          return data as T;
        } catch (error) {
          clearTimeout(timeoutId);
          
          // Don't retry on abort or validation errors
          if (
            (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError') ||
            (error as AppError).type === 'VALIDATION'
          ) {
            throw error;
          }

          lastError = error;
          
          // Retry with delay
          if (attempt < mergedConfig.retries! - 1) {
            console.warn(`API Request failed, retrying (${attempt + 1}/${mergedConfig.retries!}): ${url}`);
            await new Promise(resolve => setTimeout(resolve, mergedConfig.retryDelay!));
            continue;
          }

          throw error;
        }
      } catch (error) {
        const appError = ErrorHandler.handleError(error);
        console.error(`API Request failed: ${url}`, appError);
        throw appError;
      }
    }

    // This line should never be reached due to the loop logic
    throw lastError || new Error('API request failed');
  }

  /**
   * GET request
   */
  static async get<T>(url: string, config?: ApiClientConfig): Promise<T> {
    return this.request<T>(url, { method: 'GET' }, config);
  }

  /**
   * POST request
   */
  static async post<T>(url: string, body?: any, config?: ApiClientConfig): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, config);
  }

  /**
   * PUT request
   */
  static async put<T>(url: string, body?: any, config?: ApiClientConfig): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, config);
  }

  /**
   * DELETE request
   */
  static async delete<T>(url: string, body?: any, config?: ApiClientConfig): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }, config);
  }

  /**
   * Upload file
   */
  static async upload<T>(url: string, formData: FormData, config?: ApiClientConfig): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type, let browser set it with boundary
    }, config);
  }
}

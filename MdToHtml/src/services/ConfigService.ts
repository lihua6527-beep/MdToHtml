import { mutate } from 'swr';
import { ApiClient } from './core/ApiClient';
import { ApiResponse, CapacityStats } from '@/types/file-system';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ErrorHandler } from './core/ErrorHandler';

export class ConfigService {
  /**
   * Get capacity stats
   */
  static async getCapacity(): Promise<CapacityStats> {
    try {
      return await ApiClient.get<CapacityStats>(QUERY_KEYS.CAPACITY);
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to get capacity:', appError);
      // Return default/fallback
      return { limit: 1000, count: 0, usage: 0 };
    }
  }

  /**
   * Update capacity limit
   */
  static async updateCapacityLimit(limit: number): Promise<boolean> {
    try {
      await ApiClient.post(QUERY_KEYS.CAPACITY, { limit });
      
      // Auto-mutation
      mutate(QUERY_KEYS.CAPACITY);
      
      return true;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to update capacity:', appError);
      return false;
    }
  }

  /**
   * Get application info (paths, config)
   */
  static async getAppInfo(): Promise<any> {
    try {
      return await ApiClient.get<any>(QUERY_KEYS.APP_INFO);
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to get app info:', appError);
      return null;
    }
  }

  /**
   * Update general configuration
   */
  static async updateConfig(config: any): Promise<boolean> {
    try {
      const result = await ApiClient.post<{ success: boolean }>('/api/config', config);
      
      if (result && result.success) {
        // Refresh app info and possibly files if paths changed
        mutate(QUERY_KEYS.APP_INFO);
        mutate(QUERY_KEYS.FILES); 
      }
      
      return result && result.success;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to update config:', appError);
      return false;
    }
  }
}

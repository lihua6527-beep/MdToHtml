import { ApiClient } from './core/ApiClient';
import { ApiResponse, CapacityStats } from '@/types/file-system';

export class ConfigService {
  /**
   * Get capacity stats
   */
  static async getCapacity(): Promise<CapacityStats> {
    try {
      return await ApiClient.get<CapacityStats>('/api/config/capacity');
    } catch (error) {
      console.error('Failed to get capacity:', error);
      // Return default/fallback
      return { limit: 1000, count: 0, usage: 0 };
    }
  }

  /**
   * Update capacity limit
   */
  static async updateCapacityLimit(limit: number): Promise<boolean> {
    try {
      await ApiClient.post('/api/config/capacity', { limit });
      return true;
    } catch (error) {
      console.error('Failed to update capacity:', error);
      return false;
    }
  }

  /**
   * Get application info (paths, config)
   */
  static async getAppInfo(): Promise<any> {
    try {
      return await ApiClient.get<any>('/api/app-info');
    } catch (error) {
      console.error('Failed to get app info:', error);
      return null;
    }
  }

  /**
   * Update general configuration
   */
  static async updateConfig(config: any): Promise<boolean> {
    try {
      const result = await ApiClient.post<{ success: boolean }>('/api/config', config);
      return result && result.success;
    } catch (error) {
      console.error('Failed to update config:', error);
      return false;
    }
  }
}

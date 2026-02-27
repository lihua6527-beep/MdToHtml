import { ApiClient } from './core/ApiClient';
import { TrashItem, ApiResponse, BatchOperationResult } from '@/types/file-system';

export class TrashService {
  /**
   * Get all files in trash
   */
  static async getTrashFiles(): Promise<TrashItem[]> {
    try {
      const result = await ApiClient.get<{ files: TrashItem[] }>('/api/trash/files');
      return result?.files || [];
    } catch (error) {
      console.error('Failed to fetch trash files:', error);
      return [];
    }
  }

  /**
   * Restore files from trash
   */
  static async restoreFiles(files: string[]): Promise<BatchOperationResult> {
    try {
      // restore endpoint returns ApiResponse<BatchOperationResult>
      // The POST returns success: boolean, data: BatchOperationResult
      // ApiClient unwraps data if success is true.
      const result = await ApiClient.post<BatchOperationResult>('/api/trash/restore', { files });
      return result || { success: 0, failed: files.length, errors: ['Unknown error'] };
    } catch (error) {
      console.error('Failed to restore files:', error);
      return { success: 0, failed: files.length, errors: [(error as Error).message] };
    }
  }

  /**
   * Permanently delete files from trash
   */
  static async deleteFiles(files: string[]): Promise<BatchOperationResult> {
    try {
      // delete endpoint returns BatchOperationResult directly (no success: boolean wrapper)
      // ApiClient will return the whole object as T because 'success' is number, not boolean.
      const result = await ApiClient.post<BatchOperationResult>('/api/trash/delete', { files });
      return result;
    } catch (error) {
      console.error('Failed to delete trash files:', error);
      return { success: 0, failed: files.length, errors: [(error as Error).message] };
    }
  }

  /**
   * Empty trash
   */
  static async emptyTrash(): Promise<boolean> {
    try {
      await ApiClient.post('/api/trash/empty');
      return true;
    } catch (error) {
      console.error('Failed to empty trash:', error);
      return false;
    }
  }

  /**
   * Get trash statistics
   */
  static async getTrashStats(): Promise<{ count: number; size: number }> {
    try {
      return await ApiClient.get<{ count: number; size: number }>('/api/trash/stats');
    } catch (error) {
      console.error('Failed to get trash stats:', error);
      return { count: 0, size: 0 };
    }
  }
}

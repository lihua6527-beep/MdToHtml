import { mutate } from 'swr';
import { ApiClient } from './core/ApiClient';
import { TrashItem, ApiResponse, BatchOperationResult } from '@/types/file-system';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ErrorHandler } from './core/ErrorHandler';

export class TrashService {
  /**
   * Get all files in trash
   */
  static async getTrashFiles(): Promise<TrashItem[]> {
    try {
      const result = await ApiClient.get<{ files: TrashItem[] }>(QUERY_KEYS.TRASH_FILES);
      return result?.files || [];
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to fetch trash files:', appError);
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
      
      const success = result && (result.success > 0 || result.failed === 0);
      
      if (success || (result && result.success > 0)) {
        mutate(QUERY_KEYS.FILES);
        mutate(QUERY_KEYS.TRASH_FILES);
        mutate(QUERY_KEYS.TRASH_STATS);
        mutate(QUERY_KEYS.CAPACITY);
      }
      
      return result || { success: 0, failed: files.length, errors: ['Unknown error'] };
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to restore files:', appError);
      return { success: 0, failed: files.length, errors: [appError.message] };
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
      
      if (result && result.success > 0) {
        mutate(QUERY_KEYS.TRASH_FILES);
        mutate(QUERY_KEYS.TRASH_STATS);
      }
      
      return result;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to delete trash files:', appError);
      return { success: 0, failed: files.length, errors: [appError.message] };
    }
  }

  /**
   * Empty trash
   */
  static async emptyTrash(): Promise<boolean> {
    try {
      await ApiClient.post('/api/trash/empty');
      
      mutate(QUERY_KEYS.TRASH_FILES);
      mutate(QUERY_KEYS.TRASH_STATS);
      
      return true;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to empty trash:', appError);
      return false;
    }
  }

  /**
   * Get trash statistics
   */
  static async getTrashStats(): Promise<{ count: number; size: number }> {
    try {
      return await ApiClient.get<{ count: number; size: number }>(QUERY_KEYS.TRASH_STATS);
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to get trash stats:', appError);
      return { count: 0, size: 0 };
    }
  }
}

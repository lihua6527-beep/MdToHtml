import { mutate } from 'swr';
import { ApiClient } from './core/ApiClient';
import { TransactionManager } from './core/TransactionManager';
import PermissionManager, { PermissionLevel } from './core/PermissionManager';
import { FileItem, FileDeleteRequest, FileSaveRequest, FileSaveResponse } from '@/types/file-system';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ErrorHandler } from './core/ErrorHandler';

export class FileService {
  private static readonly BASE_URL = QUERY_KEYS.FILES;

  /**
   * Get all files
   * @returns Array of file items
   */
  static async getAllFiles(): Promise<FileItem[]> {
    try {
      const result = await ApiClient.get<FileItem[]>(this.BASE_URL);
      // Ensure result is an array
      if (Array.isArray(result)) {
        return result;
      }
      // Handle wrapped response if ApiClient didn't unwrap it
      if ((result as any).data && Array.isArray((result as any).data)) {
        return (result as any).data;
      }
      return [];
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to fetch files:', appError);
      return [];
    }
  }

  /**
   * Get file by slug
   * @param slug File slug
   * @returns File content or null if not found
   */
  static async getFileBySlug(slug: string): Promise<string | null> {
    try {
      const result = await ApiClient.get<{ content: string; slug: string }>(`${this.BASE_URL}/${slug}`);
      return result ? result.content : null;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to load file:', appError);
      return null;
    }
  }

  /**
   * Delete a file
   * @param slug File slug
   * @param deleteOutput Whether to delete output files
   * @returns True if successful
   */
  static async deleteFile(slug: string, deleteOutput: boolean = false): Promise<boolean> {
    try {
      // Check permission
      PermissionManager.requirePermission(PermissionLevel.DELETE);
      
      const request: FileDeleteRequest = { slug, deleteOutput };
      const result = await ApiClient.post<{ count: number }>('/api/delete', request);
      const success = result && typeof result === 'object';
      
      if (success) {
        // Auto-mutation
        mutate(QUERY_KEYS.FILES);
        mutate(QUERY_KEYS.CAPACITY);
        mutate(QUERY_KEYS.TRASH_FILES);
        mutate(QUERY_KEYS.TRASH_STATS);
      }
      
      return success;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to delete file:', appError);
      return false;
    }
  }

  /**
   * Delete multiple files
   * @param slugs Array of file slugs
   * @param deleteOutput Whether to delete output files
   * @returns True if successful
   */
  static async deleteMultipleFiles(slugs: string[], deleteOutput: boolean = false): Promise<boolean> {
    try {
      // Check permission
      PermissionManager.requirePermission(PermissionLevel.DELETE);
      
      const request: FileDeleteRequest = { slugs, deleteOutput };
      const result = await ApiClient.post<{ count: number }>('/api/delete', request);
      const success = result && typeof result === 'object';

      if (success) {
        mutate(QUERY_KEYS.FILES);
        mutate(QUERY_KEYS.CAPACITY);
        mutate(QUERY_KEYS.TRASH_FILES);
        mutate(QUERY_KEYS.TRASH_STATS);
      }

      return success;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to delete files:', appError);
      return false;
    }
  }

  /**
   * Save a file
   * @param slug File slug
   * @param content File content
   * @param operations Optional operation log
   * @returns True if successful
   */
  static async saveFile(slug: string, content: string, operations?: any[]): Promise<boolean> {
    try {
      // Check permission
      PermissionManager.requirePermission(PermissionLevel.WRITE);
      
      const request: FileSaveRequest = { slug, content, operations };
      const result = await ApiClient.post<FileSaveResponse>('/api/save', request);
      const success = result && (result.success === true || result.slug === slug);

      if (success) {
        mutate(QUERY_KEYS.FILES);
        mutate(QUERY_KEYS.CAPACITY);
      }

      return success;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to save file:', appError);
      return false;
    }
  }

  /**
   * Log training data
   * @param data Training data
   * @returns True if successful
   */
  static async logTrainingData(data: any): Promise<boolean> {
    try {
      // Check permission
      PermissionManager.requirePermission(PermissionLevel.ADMIN);
      
      await ApiClient.post('/api/dataset', data);
      return true;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to log training data:', appError);
      return false;
    }
  }

  /**
   * Save exported HTML
   * @param data Export data
   * @returns True if successful
   */
  static async saveExport(data: any): Promise<boolean> {
    try {
      // Check permission
      PermissionManager.requirePermission(PermissionLevel.WRITE);
      
      await ApiClient.post('/api/save-export', data);
      // Refresh capacity in case output files affect storage
      mutate(QUERY_KEYS.CAPACITY);
      return true;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to save export:', appError);
      return false;
    }
  }

  /**
   * Move file from one location to another (atomic operation)
   * @param oldSlug Current file slug
   * @param newSlug New file slug
   * @returns True if successful
   */
  static async moveFile(oldSlug: string, newSlug: string): Promise<boolean> {
    try {
      // Check permissions (requires both write and delete)
      PermissionManager.requireAllPermissions([PermissionLevel.WRITE, PermissionLevel.DELETE]);
      
      // Create transaction for atomic operation
      const transaction = TransactionManager.createTransaction();

      let fileContent: string | null = null;

      // Step 1: Read the file content
      transaction.addOperation(
        async () => {
          const content = await this.getFileBySlug(oldSlug);
          if (!content) {
            throw new Error(`File not found: ${oldSlug}`);
          }
          fileContent = content;
          return content;
        },
        async () => {
          // No rollback needed for read operation
          return true;
        },
        'Read file content'
      );

      // Step 2: Save the file to new location
      transaction.addOperation(
        async () => {
          if (!fileContent) {
            throw new Error('File content not available');
          }
          const success = await this.saveFile(newSlug, fileContent);
          if (!success) {
            throw new Error(`Failed to save file to new location: ${newSlug}`);
          }
          return success;
        },
        async () => {
          // Rollback: Delete the newly created file
          await this.deleteFile(newSlug, true);
          return true;
        },
        'Save file to new location'
      );

      // Step 3: Delete the old file
      transaction.addOperation(
        async () => {
          const success = await this.deleteFile(oldSlug, true);
          if (!success) {
            throw new Error(`Failed to delete old file: ${oldSlug}`);
          }
          return success;
        },
        async () => {
          // Rollback: Restore the old file
          if (fileContent) {
            await this.saveFile(oldSlug, fileContent);
          }
          return true;
        },
        'Delete old file'
      );

      // Execute the transaction with retry
      const success = await TransactionManager.executeWithRetry(transaction);

      if (success) {
        // Refresh all relevant data
        mutate(QUERY_KEYS.FILES);
        mutate(QUERY_KEYS.CAPACITY);
      }

      return success;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      console.error('Failed to move file:', appError);
      return false;
    }
  }
}

// Backward compatibility
export const getFiles = FileService.getAllFiles;
export const loadFile = FileService.getFileBySlug;
export const deleteFiles = FileService.deleteMultipleFiles;

import { mutate } from 'swr';
import { ApiClient } from './core/ApiClient';
import { TransactionManager } from './core/TransactionManager';
import PermissionManager, { PermissionLevel } from './core/PermissionManager';
import { FileItem, FileDeleteRequest, FileSaveRequest, FileSaveResponse } from '@/types/file-system';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ErrorHandler } from './core/ErrorHandler';
import { logger } from '@/lib/logger';
import matter from 'gray-matter';

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
      logger.error('Failed to fetch files', {
        module: 'FileService',
        context: { error: appError }
      });
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
      logger.error('Failed to load file', {
        module: 'FileService',
        context: { error: appError, slug }
      });
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
      logger.error('Failed to delete file', {
        module: 'FileService',
        context: { error: appError, slug, deleteOutput }
      });
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
      logger.error('Failed to delete files', {
        module: 'FileService',
        context: { error: appError, slugs, deleteOutput }
      });
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
      
      // Validate input
      if (!slug || !content) {
        console.error('Invalid input: slug or content is missing');
        return false;
      }
      
      const request: FileSaveRequest = { slug, content, operations };
      const result = await ApiClient.post<any>('/api/save', request);
      // ApiClient 已自动解包：API返回 { success: true, data: { slug } } → result = { slug }
      // 只要 result 非空即表示保存成功
      const success = result !== null && result !== undefined;

      if (success) {
        mutate(QUERY_KEYS.FILES);
        mutate(QUERY_KEYS.CAPACITY);
      }

      return success;
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      logger.error('Failed to save file', {
        module: 'FileService',
        context: { error: appError, slug }
      });
      // Handle specific file system errors
      if (appError.message.includes('disk') || appError.message.includes('space') || appError.message.includes('quota')) {
        logger.error('Disk space error', {
          module: 'FileService',
          context: { error: appError, slug }
        });
        // Here you could show a user-friendly message about disk space
      }
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
      logger.error('Failed to log training data', {
        module: 'FileService',
        context: { error: appError, data: typeof data === 'object' ? Object.keys(data) : data }
      });
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
      logger.error('Failed to save export', {
        module: 'FileService',
        context: { error: appError, data: typeof data === 'object' ? Object.keys(data) : data }
      });
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
      // Validate input
      if (!oldSlug || !newSlug) {
        console.error('Invalid input: oldSlug or newSlug is missing');
        return false;
      }
      
      if (oldSlug === newSlug) {
        console.error('Old and new slug are the same');
        return false;
      }
      
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
          try {
            await this.deleteFile(newSlug, true);
          } catch (rollbackError) {
            console.warn('Failed to rollback file creation:', rollbackError);
          }
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
            try {
              await this.saveFile(oldSlug, fileContent);
            } catch (rollbackError) {
              console.warn('Failed to rollback file deletion:', rollbackError);
            }
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
      logger.error('Failed to move file', {
        module: 'FileService',
        context: { error: appError, oldSlug, newSlug }
      });
      // Handle specific file system errors
      if (appError.message.includes('disk') || appError.message.includes('space') || appError.message.includes('quota')) {
        logger.error('Disk space error during move', {
          module: 'FileService',
          context: { error: appError, oldSlug, newSlug }
        });
      } else if (appError.message.includes('permission') || appError.message.includes('access')) {
        logger.error('Permission error during move', {
          module: 'FileService',
          context: { error: appError, oldSlug, newSlug }
        });
      }
      return false;
    }
  }

  /**
   * Update file type
   * @param slug File slug
   * @param type New file type
   * @returns True if successful
   */
  static async updateFileType(slug: string, type: string): Promise<boolean> {
    try {
      logger.info(`Updating file type for ${slug} to ${type}`, {
        module: 'FileService'
      });
      
      // Check permission
      try {
        PermissionManager.requirePermission(PermissionLevel.WRITE);
        logger.debug('Permission check passed', {
          module: 'FileService'
        });
      } catch (permError) {
        logger.error('Permission error', {
          module: 'FileService',
          context: { error: permError, slug, type }
        });
        return false;
      }
      
      // Get file content
      const content = await this.getFileBySlug(slug);
      logger.debug(`Got file content: ${content ? 'success' : 'failed'}`, {
        module: 'FileService',
        context: { slug }
      });
      
      if (!content) {
        logger.error(`File not found: ${slug}`, {
          module: 'FileService',
          context: { slug }
        });
        return false;
      }
      
      // Update frontmatter
      try {
        const { data, content: body } = matter(content);
        logger.debug('Parsed frontmatter successfully', {
          module: 'FileService',
          context: { slug }
        });
        
        const updatedData = {
          ...data,
          type: type
        };
        
        const updatedContent = matter.stringify(body, updatedData);
        logger.debug('Generated updated content', {
          module: 'FileService',
          context: { slug }
        });
        
        // Save file
        const success = await this.saveFile(slug, updatedContent);
        logger.debug(`Save file result: ${success}`, {
          module: 'FileService',
          context: { slug, success }
        });
        
        if (success) {
          // Refresh cache
          mutate(QUERY_KEYS.FILES);
          logger.debug('Refreshed cache', {
            module: 'FileService'
          });
        }
        
        return success;
      } catch (parseError) {
        logger.error('Frontmatter parsing error', {
          module: 'FileService',
          context: { error: parseError, slug }
        });
        return false;
      }
    } catch (error) {
      const appError = ErrorHandler.handleError(error);
      logger.error('Failed to update file type', {
        module: 'FileService',
        context: { error: appError, slug, type }
      });
      return false;
    }
  }
}

// Backward compatibility
export const getFiles = FileService.getAllFiles;
export const loadFile = FileService.getFileBySlug;
export const deleteFiles = FileService.deleteMultipleFiles;

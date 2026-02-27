import { ApiClient } from './core/ApiClient';
import { FileItem, ApiResponse } from '@/types/file-system';

export class FileService {
  private static readonly BASE_URL = '/api/files';

  /**
   * Get all files
   */
  static async getFiles(): Promise<FileItem[]> {
    try {
      const result = await ApiClient.get<FileItem[]>(this.BASE_URL);
      // Ensure result is an array
      if (Array.isArray(result)) {
        return result;
      }
      // Handle wrapped response if ApiClient didn't unwrap it (e.g. if structure is different)
      if ((result as any).data && Array.isArray((result as any).data)) {
        return (result as any).data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch files:', error);
      return [];
    }
  }

  /**
   * Delete a file by slug (filename)
   */
  static async deleteFile(slug: string): Promise<boolean> {
    try {
      const result = await ApiClient.post<{ count: number }>('/api/delete', { slug });
      return result && typeof result === 'object' ? true : false;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Delete multiple files by slugs
   */
  static async deleteFiles(slugs: string[]): Promise<boolean> {
    try {
      const result = await ApiClient.post<{ count: number }>('/api/delete', { slugs });
      return result && typeof result === 'object' ? true : false;
    } catch (error) {
      console.error('Failed to delete files:', error);
      return false;
    }
  }

  /**
   * Save a file with content and optional operation log
   */
  static async saveFile(slug: string, content: string, operations?: any[]): Promise<boolean> {
    try {
      const result = await ApiClient.post<{ success: boolean; slug: string }>('/api/save', { 
        slug, 
        content,
        operations
      });
      return result && (result.success === true || (result as any).slug === slug);
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  }

  static async loadFile(slug: string): Promise<string | null> {
    try {
      const result = await ApiClient.get<{ content: string; slug: string }>(`${this.BASE_URL}/${slug}`);
      return result ? result.content : null;
    } catch (error) {
      console.error('Failed to load file:', error);
      return null;
    }
  }

  /**
   * Log training data
   */
  static async logTrainingData(data: any): Promise<boolean> {
    try {
      await ApiClient.post('/api/dataset', data);
      return true;
    } catch (error) {
      console.error('Failed to log training data:', error);
      return false;
    }
  }

  /**
   * Save exported HTML
   */
  static async saveExport(data: any): Promise<boolean> {
    try {
      await ApiClient.post('/api/save-export', data);
      return true;
    } catch (error) {
      console.error('Failed to save export:', error);
      return false;
    }
  }
}

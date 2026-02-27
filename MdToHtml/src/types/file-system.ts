/**
 * File System and Cache Type Definitions
 * Unifies interfaces across cache-manager, trash-manager, and frontend components.
 */

export interface FileSystemEntry {
  path: string; // Absolute path or relative path depending on context
  name: string; // Filename with extension
  basename: string; // Filename without extension
  extension: string; // .md, .markdown, etc.
  isDirectory: boolean;
  mtime: number; // Modified time
  birthtime: number; // Creation time (Import time)
  size: number; // Size in bytes
}

export interface FileItem {
  slug: string; // Usually the filename or relative path
  mtime: number;
  birthtime?: number;
  status?: string; // 'active', 'deleted', 'archived'
  title?: string; // Extracted title from content
  tags?: string[];
  excerpt?: string;
  [key: string]: any;
}

export interface CacheEntry extends FileItem {
  path: string; // Filename (basename) in cache-manager context
  // Inherits mtime, birthtime, status, title, tags, excerpt
}

export interface MetadataCache {
  version: string;
  lastUpdated: number;
  capacity_limit: number;
  entries: CacheEntry[];
}

export interface TrashItem {
  name: string; // Physical filename in trash (e.g., "file_1234567890.md")
  originalName: string; // Restorable name (e.g., "file.md")
  deletedAt: number;
  size: number;
}

export interface TrashStats {
  count: number;
  size: number; // in bytes
}

export type SortMethod = 'import' | 'visited' | 'modified';

export interface FileOperationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface BatchOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string; // Optional user-friendly message
  meta?: any; // Pagination, etc.
}

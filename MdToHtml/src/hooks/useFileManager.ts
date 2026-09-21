import React, { useCallback } from 'react';
import { FileItem, TrashItem, CapacityStats, TrashStats } from '@/types/file-system';
import { useFiles, useCapacity, useTrash } from './useFileSystem';
import { TrashService } from '@/services/TrashService';
import { FileService } from '@/services/FileService';
import { ConfigService } from '@/services/ConfigService';
import { mutate } from 'swr';
import { QUERY_KEYS } from '@/constants/query-keys';

/**
 * Centralized file management hook
 * Provides unified state and operations for file system management
 */
export function useFileManager() {
  // Use existing hooks for data fetching
  const { files, isLoading: isFilesLoading, isError: isFilesError, refresh: refreshFiles } = useFiles();
  const { stats: capacityStats, isLoading: isCapacityLoading, isError: isCapacityError, refresh: refreshCapacity } = useCapacity();
  const { files: trashFiles, isLoading: isTrashLoading, isError: isTrashError, refresh: refreshTrash } = useTrash();

  // Unified loading and error states
  const isLoading = isFilesLoading || isCapacityLoading || isTrashLoading;
  const isError = isFilesError || isCapacityError || isTrashError;

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshFiles(),
      refreshCapacity(),
      refreshTrash()
    ]);
  }, [refreshFiles, refreshCapacity, refreshTrash]);

  // File operations
  const deleteFile = useCallback(async (slug: string, deleteOutput: boolean = false) => {
    const success = await FileService.deleteFile(slug, deleteOutput);
    if (success) {
      // Auto-mutation handled by FileService
    }
    return success;
  }, []);

  const deleteFiles = useCallback(async (slugs: string[], deleteOutput: boolean = false) => {
    const success = await FileService.deleteMultipleFiles(slugs, deleteOutput);
    if (success) {
      // Auto-mutation handled by FileService
    }
    return success;
  }, []);

  const saveFile = useCallback(async (slug: string, content: string, operations?: any[]) => {
    const success = await FileService.saveFile(slug, content, operations);
    if (success) {
      // Auto-mutation handled by FileService
    }
    return success;
  }, []);

  const loadFile = useCallback(async (slug: string) => {
    return await FileService.getFileBySlug(slug);
  }, []);

  // Trash operations
  const restoreFiles = useCallback(async (files: string[]) => {
    const result = await TrashService.restoreFiles(files);
    if (result.success > 0) {
      // Auto-mutation handled by TrashService
    }
    return result;
  }, []);

  const deleteTrashFiles = useCallback(async (files: string[]) => {
    const result = await TrashService.deleteFiles(files);
    if (result.success > 0) {
      // Auto-mutation handled by TrashService
    }
    return result;
  }, []);

  const emptyTrash = useCallback(async () => {
    const success = await TrashService.emptyTrash();
    if (success) {
      // Auto-mutation handled by TrashService
    }
    return success;
  }, []);

  const getTrashStats = useCallback(async () => {
    return await TrashService.getTrashStats();
  }, []);

  // Capacity operations
  const updateCapacity = useCallback(async (limit: number) => {
    const success = await ConfigService.updateCapacityLimit(limit);
    if (success) {
      // Auto-mutation handled by ConfigService
    }
    return success;
  }, []);

  const getAppInfo = useCallback(async () => {
    return await ConfigService.getAppInfo();
  }, []);

  const updateConfig = useCallback(async (config: any) => {
    const success = await ConfigService.updateConfig(config);
    if (success) {
      // Auto-mutation handled by ConfigService
    }
    return success;
  }, []);

  return {
    // State
    files,
    capacityStats,
    trashFiles,
    isLoading,
    isError,
    
    // Operations
    refreshAll,
    refreshFiles,
    refreshCapacity,
    refreshTrash,
    
    // File operations
    deleteFile,
    deleteFiles,
    saveFile,
    loadFile,
    
    // Trash operations
    restoreFiles,
    deleteTrashFiles,
    emptyTrash,
    getTrashStats,
    
    // Capacity operations
    updateCapacity,
    getAppInfo,
    updateConfig
  };
}

/**
 * Hook for file selection state management
 */
export function useFileSelection(initialSelected: string[] = []) {
  const [selectedFiles, setSelectedFiles] = React.useState<Set<string>>(new Set(initialSelected));
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);

  const toggleSelection = useCallback((slug: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((allFiles: FileItem[]) => {
    if (selectedFiles.size === allFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(allFiles.map(file => file.slug)));
    }
  }, [selectedFiles.size]);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (!prev) {
        clearSelection();
      }
      return !prev;
    });
  }, [clearSelection]);

  return {
    selectedFiles,
    isSelectionMode,
    selectedCount: selectedFiles.size,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode
  };
}

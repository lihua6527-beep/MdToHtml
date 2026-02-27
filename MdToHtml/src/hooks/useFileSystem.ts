import useSWR, { mutate } from 'swr';
import { FileItem, TrashItem, CapacityStats } from '@/types/file-system';
import { FileService } from '@/services/FileService';
import { TrashService } from '@/services/TrashService';
import { ConfigService } from '@/services/ConfigService';

// Hook for files list
export function useFiles(fallbackData?: FileItem[]) {
  const { data, error, isLoading, mutate: refresh } = useSWR<FileItem[]>(
    '/api/files', 
    () => FileService.getFiles(),
    {
      fallbackData,
      // Keep previous data while revalidating for smoother UX
      keepPreviousData: true
    }
  );
  
  return {
    files: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refresh
  };
}

// Hook for capacity stats
export function useCapacity() {
  const { data, error, isLoading } = useSWR<CapacityStats>(
    '/api/config/capacity', 
    () => ConfigService.getCapacity(),
    {
      refreshInterval: 30000 // Poll every 30s
    }
  );
  
  return {
    stats: data,
    isLoading,
    isError: error,
    refresh: () => mutate('/api/config/capacity')
  };
}

// Hook for trash files
export function useTrash() {
  const { data, error, isLoading } = useSWR<TrashItem[]>(
    '/api/trash/files', 
    () => TrashService.getTrashFiles()
  );
  
  return {
    files: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refresh: () => mutate('/api/trash/files')
  };
}

import useSWR, { mutate } from 'swr';
import { FileItem, TrashItem, CapacityStats } from '@/types/file-system';
import { FileService } from '@/services/FileService';
import { TrashService } from '@/services/TrashService';
import { ConfigService } from '@/services/ConfigService';
import { QUERY_KEYS } from '@/constants/query-keys';

// Hook for files list
export function useFiles(fallbackData?: FileItem[]) {
  const { data, error, isLoading, mutate: refresh } = useSWR<FileItem[]>(
    QUERY_KEYS.FILES, 
    () => FileService.getAllFiles(),
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
    QUERY_KEYS.CAPACITY, 
    () => ConfigService.getCapacity(),
    {
      refreshInterval: 30000 // Poll every 30s
    }
  );
  
  return {
    stats: data,
    isLoading,
    isError: error,
    refresh: () => mutate(QUERY_KEYS.CAPACITY)
  };
}

// Hook for trash files
export function useTrash() {
  const { data, error, isLoading } = useSWR<TrashItem[]>(
    QUERY_KEYS.TRASH_FILES, 
    () => TrashService.getTrashFiles()
  );
  
  return {
    files: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refresh: () => mutate(QUERY_KEYS.TRASH_FILES)
  };
}

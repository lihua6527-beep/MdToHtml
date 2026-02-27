import useSWR, { mutate } from 'swr';
import { FileItem, TrashItem, ApiResponse } from '@/types/file-system';

const fetcher = (url: string) => fetch(url).then(async (res) => {
  if (!res.ok) throw new Error('API Error');
  const json = await res.json();
  // Handle ApiResponse format { success: true, data: T }
  if (json.success && json.data) return json.data;
  // Fallback for direct returns or other formats
  return json;
});

// Hook for files list
export function useFiles(fallbackData?: FileItem[]) {
  const { data, error, isLoading, mutate: refresh } = useSWR<FileItem[]>('/api/files', fetcher, {
    fallbackData
  });
  return {
    files: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refresh
  };
}

// Hook for capacity stats
export interface CapacityStats {
  limit: number;
  count: number;
  usage: number;
}

export function useCapacity() {
  const { data, error, isLoading } = useSWR<CapacityStats>('/api/config/capacity', fetcher, {
    refreshInterval: 30000 // Poll every 30s
  });
  
  return {
    stats: data,
    isLoading,
    isError: error,
    refresh: () => mutate('/api/config/capacity')
  };
}

// Hook for trash files
export function useTrash() {
  const { data, error, isLoading } = useSWR<any>('/api/trash/files', fetcher);
  
  // Handle various potential return shapes
  let files: TrashItem[] = [];
  if (Array.isArray(data)) {
    files = data;
  } else if (data?.files && Array.isArray(data.files)) {
    files = data.files;
  }

  return {
    files,
    isLoading,
    isError: error,
    refresh: () => mutate('/api/trash/files')
  };
}

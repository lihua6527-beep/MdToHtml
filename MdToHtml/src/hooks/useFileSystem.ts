import useSWR, { mutate } from 'swr';
import { FileItem, TrashItem, CapacityStats } from '@/types/file-system';
import { FileService } from '@/services/FileService';
import { TrashService } from '@/services/TrashService';
import { ConfigService } from '@/services/ConfigService';
import { QUERY_KEYS } from '@/constants/query-keys';

// Cache configuration
const SWR_CONFIG = {
  // 缓存时间：5分钟
  dedupingInterval: 5 * 60 * 1000,
  // 聚焦时不自动重验证，减少不必要的请求
  revalidateOnFocus: false,
  // 网络恢复时不自动重验证
  revalidateOnReconnect: false,
  // 保持之前的数据，提升用户体验
  keepPreviousData: true,
  // 错误重试次数
  errorRetryCount: 3,
  // 错误重试间隔
  errorRetryInterval: 1000
};

// Hook for files list
export function useFiles(fallbackData?: FileItem[]) {
  const { data, error, isLoading, mutate: refresh } = useSWR<FileItem[]>(
    QUERY_KEYS.FILES, 
    () => FileService.getAllFiles(),
    {
      ...SWR_CONFIG,
      fallbackData,
      // 文件列表使用更长的缓存时间
      dedupingInterval: 10 * 60 * 1000
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
      ...SWR_CONFIG,
      // 容量统计需要定期更新
      refreshInterval: 60000 // Poll every 60s
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
    () => TrashService.getTrashFiles(),
    {
      ...SWR_CONFIG,
      // 回收站使用中等缓存时间
      dedupingInterval: 8 * 60 * 1000
    }
  );
  
  return {
    files: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refresh: () => mutate(QUERY_KEYS.TRASH_FILES)
  };
}

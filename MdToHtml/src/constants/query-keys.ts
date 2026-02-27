export const QUERY_KEYS = {
  FILES: '/api/files',
  TRASH_FILES: '/api/trash/files',
  TRASH_STATS: '/api/trash/stats',
  CAPACITY: '/api/config/capacity',
  APP_INFO: '/api/app-info',
} as const;

export type QueryKey = typeof QUERY_KEYS[keyof typeof QUERY_KEYS];

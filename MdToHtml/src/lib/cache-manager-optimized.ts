import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import PathManager from './path-manager';
import TrashManager from './trash-manager';
import { CacheEntry, MetadataCache } from '../types/file-system';
import { CACHE_FILE_NAME, DEFAULT_CAPACITY, CACHE_VERSION, MARKDOWN_EXT_RE } from './constants';

/**
 * Optimized metadata cache manager
 * Improved caching strategies for better performance and reliability
 */
export class OptimizedMetadataCacheManager {
  private static instance: OptimizedMetadataCacheManager;
  private cache: MetadataCache;
  private entryMap: Map<string, CacheEntry>;
  private currentBaseDir: string;
  private lastScanTime: number;
  private scanInterval: number = 30000; // 30 seconds
  private minScanInterval: number = 10000; // 10 seconds
  private maxScanInterval: number = 60000; // 60 seconds
  private isScanning: boolean = false;
  private isPreloading: boolean = false;
  private hotFiles: Set<string> = new Set();

  private constructor() {
    this.currentBaseDir = PathManager.getInputPath();
    this.lastScanTime = 0;
    
    // Initialize cache structure
    const config = PathManager.getAppConfig();
    const limit = config.capacityLimit || DEFAULT_CAPACITY;

    this.cache = {
      version: CACHE_VERSION,
      lastUpdated: Date.now(),
      capacity_limit: limit,
      entries: []
    };
    this.entryMap = new Map();

    this.loadCache();
    // Load hot files from visit history
    this.loadHotFiles();
    // Perform initial scan
    this.scanAndSync();
    // Start cache preloading
    this.preloadCache();
    // Start periodic scan
    this.startPeriodicScan();
  }

  /**
   * Load hot files from visit history
   */
  private loadHotFiles() {
    try {
      const visitHistory = localStorage.getItem('visited_docs');
      if (visitHistory) {
        const history = JSON.parse(visitHistory) as Record<string, number>;
        // Get top 10 most visited files
        const sorted = Object.entries(history)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        sorted.forEach(([slug]) => {
          this.hotFiles.add(slug);
        });
      }
    } catch (e) {
      console.warn('[OptimizedCacheManager] Failed to load hot files:', e);
    }
  }

  /**
   * Preload cache with hot files
   */
  private preloadCache() {
    if (this.isPreloading) return;
    
    this.isPreloading = true;
    setTimeout(() => {
      try {
        const hotFilesArray = Array.from(this.hotFiles);
        if (hotFilesArray.length > 0) {
          console.log(`[OptimizedCacheManager] Preloading ${hotFilesArray.length} hot files`);
          
          // Batch preload
          hotFilesArray.forEach(slug => {
            this.getPost(slug);
          });
        }
      } catch (e) {
        console.warn('[OptimizedCacheManager] Failed to preload cache:', e);
      } finally {
        this.isPreloading = false;
      }
    }, 1000);
  }

  public static getInstance(): OptimizedMetadataCacheManager {
    if (!OptimizedMetadataCacheManager.instance) {
      OptimizedMetadataCacheManager.instance = new OptimizedMetadataCacheManager();
    }
    return OptimizedMetadataCacheManager.instance;
  }

  /**
   * Start periodic cache synchronization
   */
  private startPeriodicScan() {
    const runScan = () => {
      if (!this.isScanning) {
        this.scanAndSync();
      }
      // Adjust scan interval based on system activity
      setTimeout(runScan, this.scanInterval);
    };
    runScan();
  }

  /**
   * Adjust scan interval based on file count and system activity
   */
  private adjustScanInterval(fileCount: number, hasChanges: boolean) {
    // Base interval adjustment based on file count
    let newInterval = this.scanInterval;
    
    if (fileCount < 10) {
      // Fewer files, can scan less frequently
      newInterval = Math.min(this.maxScanInterval, this.scanInterval * 1.5);
    } else if (fileCount > 100) {
      // More files, need to scan more frequently
      newInterval = Math.max(this.minScanInterval, this.scanInterval * 0.7);
    }
    
    // If there are changes, scan more frequently
    if (hasChanges) {
      newInterval = Math.max(this.minScanInterval, newInterval * 0.8);
    }
    
    // Update interval if changed
    if (Math.abs(newInterval - this.scanInterval) > 5000) {
      this.scanInterval = newInterval;
      console.log(`[OptimizedCacheManager] Adjusted scan interval to ${this.scanInterval}ms`);
    }
  }

  public reload() {
    this.scanAndSync();
  }

  private get baseDir(): string {
      return PathManager.getInputPath();
  }

  private get cachePath(): string {
      return path.join(this.baseDir, CACHE_FILE_NAME);
  }

  /**
   * Load cache from disk with validation
   */
  private loadCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const raw = fs.readFileSync(this.cachePath, 'utf8');
        if (!raw || raw.trim() === '') {
          console.warn('[OptimizedCacheManager] Empty cache file, resetting.');
          this.entryMap.clear();
          this.cache.entries = [];
          return;
        }
        const data = JSON.parse(raw) as MetadataCache;
        
        if (data.version === CACHE_VERSION && Array.isArray(data.entries)) {
          this.cache = data;
          // Rebuild map for O(1) access
          this.entryMap.clear();
          data.entries.forEach(entry => {
            if (entry && typeof entry.path === 'string') {
              this.entryMap.set(entry.path, entry);
            }
          });
        } else {
          console.log('[OptimizedCacheManager] Version mismatch or invalid cache, resetting.');
          this.entryMap.clear();
          this.cache.entries = [];
        }
      } else {
          // Reset if no cache file found (e.g. new directory)
          this.entryMap.clear();
          this.cache.entries = [];
      }
    } catch (e) {
      console.warn('[OptimizedCacheManager] Failed to load cache:', e);
      // Reset on error
      this.entryMap.clear();
      this.cache.entries = [];
      // Try to delete corrupted cache file
      try {
        if (fs.existsSync(this.cachePath)) {
          fs.unlinkSync(this.cachePath);
          console.log('[OptimizedCacheManager] Deleted corrupted cache file.');
        }
      } catch (deleteError) {
        console.warn('[OptimizedCacheManager] Failed to delete corrupted cache file:', deleteError);
      }
    }
  }

  /**
   * Save cache to disk with throttling
   */
  private saveCache() {
    try {
      this.cache.lastUpdated = Date.now();
      // Ensure entries matches the map (sorted by mtime desc)
      this.cache.entries = Array.from(this.entryMap.values())
        .sort((a, b) => b.mtime - a.mtime);
      
      // Ensure base directory exists
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
      
      fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2), 'utf8');
    } catch (e) {
      console.error('[OptimizedCacheManager] Failed to save cache:', e);
      // Don't crash the system if cache save fails
    }
  }

  /**
   * Core logic: Scan directory, update cache, and handle capacity
   */
  public scanAndSync() {
    if (this.isScanning) return;
    
    this.isScanning = true;
    try {
      // Check if path changed
      const newBaseDir = this.baseDir;
      if (newBaseDir !== this.currentBaseDir) {
          console.log(`[OptimizedCacheManager] Base directory changed from ${this.currentBaseDir} to ${newBaseDir}. Reloading cache.`);
          this.currentBaseDir = newBaseDir;
          this.loadCache();
      }

      // Ensure base directory exists
      if (!fs.existsSync(this.baseDir)) {
        try {
          fs.mkdirSync(this.baseDir, { recursive: true });
        } catch (mkdirError) {
          console.error('[OptimizedCacheManager] Failed to create base directory:', mkdirError);
          this.isScanning = false;
          return;
        }
        this.isScanning = false;
        return;
      }

      // 1. Scan directory
      let files: string[] = [];
      try {
        files = fs.readdirSync(this.baseDir);
      } catch (readdirError) {
        console.error('[OptimizedCacheManager] Failed to read directory:', readdirError);
        this.isScanning = false;
        return;
      }

      const mdFiles = files.filter(f => 
        f && typeof f === 'string' &&
        MARKDOWN_EXT_RE.test(f) && 
        !f.startsWith('.') && // Ignore hidden files like .metadata_cache.json
        f !== CACHE_FILE_NAME
      );

      console.log(`[OptimizedCacheManager] Scanning ${mdFiles.length} files in ${this.baseDir}`);

      const currentFilesSet = new Set(mdFiles);
      let hasChanges = false;

      // 2. Update entries based on file system (parallel processing for better performance)
      const updatePromises = mdFiles.map(async (file) => {
        const fullPath = path.join(this.baseDir, file);
        try {
          const stats = fs.statSync(fullPath);
          const cached = this.entryMap.get(file);

          // If not cached or modified, read file content
          if (!cached || Math.abs(cached.mtime - stats.mtimeMs) > 100) { // 100ms tolerance
            const content = fs.readFileSync(fullPath, 'utf8');
            const { data, excerpt } = matter(content, { excerpt: true });
            
            const newEntry: CacheEntry = {
              path: file,
              slug: file.replace(MARKDOWN_EXT_RE, ''),
              mtime: stats.mtimeMs,
              birthtime: stats.birthtimeMs,
              status: data.status,
              title: data.title || file.replace(MARKDOWN_EXT_RE, ''),
              tags: data.tags,
              excerpt: excerpt || undefined,
            };
            
            this.entryMap.set(file, newEntry);
            hasChanges = true;
            console.log(`[OptimizedCacheManager] Synced entry: ${file}`);
          }
        } catch (e) {
          console.warn(`[OptimizedCacheManager] Failed to process file ${file}:`, e);
        }
      });

      // Wait for all updates to complete
      Promise.all(updatePromises).then(() => {
        try {
          // 3. Remove entries that no longer exist in FS
          const keys = Array.from(this.entryMap.keys());
          for (const key of keys) {
            if (!currentFilesSet.has(key)) {
              this.entryMap.delete(key);
              hasChanges = true;
              console.log(`[OptimizedCacheManager] Removed stale entry: ${key}`);
            }
          }

          // 4. Sort and Capacity Check
          // Get current limit from config (reload if needed)
          let currentLimit = DEFAULT_CAPACITY;
          try {
            const config = PathManager.getAppConfig();
            currentLimit = config.capacityLimit || DEFAULT_CAPACITY;
          } catch (configError) {
            console.warn('[OptimizedCacheManager] Failed to get config, using default capacity:', configError);
          }
          this.cache.capacity_limit = currentLimit; // Update cache internal state

          const sortedEntries = Array.from(this.entryMap.values())
            .sort((a, b) => b.mtime - a.mtime);
          
          if (sortedEntries.length > currentLimit) {
            // Identify overflow files
            const overflow = sortedEntries.slice(currentLimit);
            const keep = sortedEntries.slice(0, currentLimit);
            
            console.log(`[OptimizedCacheManager] Capacity exceeded (${sortedEntries.length} > ${currentLimit}). Moving ${overflow.length} files to trash.`);
            
            // Move overflow to trash via TrashManager
            try {
              const overflowPaths = overflow.map(e => e.path); // Relative paths
              TrashManager.moveToTrash(overflowPaths);
            } catch (trashError) {
              console.error('[OptimizedCacheManager] Failed to move files to trash:', trashError);
            }
            
            // Update map to only keep valid entries
            this.entryMap.clear();
            keep.forEach(e => this.entryMap.set(e.path, e));
            hasChanges = true;
          }

          // 5. Adjust scan interval based on file count and changes
          this.adjustScanInterval(mdFiles.length, hasChanges);

          if (hasChanges) {
            this.saveCache();
          }

          this.lastScanTime = Date.now();
        } catch (syncError) {
          console.error('[OptimizedCacheManager] Sync processing failed:', syncError);
        } finally {
          this.isScanning = false;
        }
      }).catch((error) => {
        console.error('[OptimizedCacheManager] Scan failed:', error);
        this.isScanning = false;
      });
    } catch (e) {
      console.error('[OptimizedCacheManager] Scan failed:', e);
      this.isScanning = false;
    }
  }

  /**
   * Public API: Get all cached posts
   * Returns O(1) memory reference (sorted)
   */
  public getAll(): CacheEntry[] {
    if (this.baseDir !== this.currentBaseDir || Date.now() - this.lastScanTime > this.scanInterval) {
        this.scanAndSync();
    }
    // Return sorted list
    return Array.from(this.entryMap.values()).sort((a, b) => b.mtime - a.mtime);
  }
  
  /**
   * Public API: Get capacity limit
   */
  public getCapacityLimit(): number {
      const config = PathManager.getAppConfig();
      return config.capacityLimit || DEFAULT_CAPACITY;
  }

  /**
   * Public API: Get single post content (with caching optimization)
   * This is a helper that uses the cache to locate, but reads content on demand.
   */
  public getPost(slug: string): { slug: string, content: string, metadata?: CacheEntry } | null {
    if (this.baseDir !== this.currentBaseDir) {
        this.scanAndSync();
    }
    
    // Optimized lookup: check cache first
    const candidates = MARKDOWN_EXT_RE.test(slug) ? [slug] : [`${slug}.md`, `${slug}.markdown`];
    
    // First check in cache
    let filename = candidates.find(c => this.entryMap.has(c));
    
    // If not in cache, check disk
    if (!filename) {
      try {
        filename = candidates.find(c => fs.existsSync(path.join(this.baseDir, c)));
      } catch (existsError) {
        console.warn('[OptimizedCacheManager] Failed to check file existence:', existsError);
        return null;
      }
    }
    
    // Fallback to first candidate
    if (!filename) {
      filename = candidates[0];
    }

    const entry = this.entryMap.get(filename);
    const fullPath = path.join(this.baseDir, filename);
    
    try {
      if (!fs.existsSync(fullPath)) return null;

      // Read content from disk
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Update cache if file has been modified
      try {
        const stats = fs.statSync(fullPath);
        if (!entry || Math.abs(entry.mtime - stats.mtimeMs) > 100) {
          const { data, excerpt } = matter(content, { excerpt: true });
          const newEntry: CacheEntry = {
            path: filename,
            slug: filename.replace(MARKDOWN_EXT_RE, ''),
            mtime: stats.mtimeMs,
            birthtime: stats.birthtimeMs,
            status: data.status,
            title: data.title || filename.replace(MARKDOWN_EXT_RE, ''),
            tags: data.tags,
            excerpt: excerpt || undefined,
          };
          this.entryMap.set(filename, newEntry);
          this.saveCache();
          return {
            slug: filename.replace(MARKDOWN_EXT_RE, ''),
            content,
            metadata: newEntry
          };
        }
      } catch (e) {
        console.warn(`[OptimizedCacheManager] Failed to update cache for ${filename}:`, e);
        // Continue without updating cache
      }

      return {
        slug: filename.replace(MARKDOWN_EXT_RE, ''),
        content,
        metadata: entry
      };
    } catch (readError) {
      console.error(`[OptimizedCacheManager] Failed to read file ${filename}:`, readError);
      return null;
    }
  }

  /**
   * Public API: Update or Create a post
   * Updates cache immediately with optimized write strategy
   */
  public update(slug: string, content: string): void {
    if (this.baseDir !== this.currentBaseDir) {
        this.scanAndSync();
    }
    
    // Clean slug
    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5\s_.\(\)]/g, '');
    const filename = safeSlug.endsWith('.md') ? safeSlug : `${safeSlug}.md`;
    const fullPath = path.join(this.baseDir, filename);

    // Write file with error handling
    try {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`[OptimizedCacheManager] File written: ${fullPath}`);

      // Update Cache
      const stats = fs.statSync(fullPath);
      const { data, excerpt } = matter(content, { excerpt: true });
      
      const entry: CacheEntry = {
                path: filename,
                slug: safeSlug.replace(/\.md$/i, ''),
                mtime: stats.mtimeMs,
                birthtime: stats.birthtimeMs,
                status: data.status,
                title: data.title || safeSlug.replace(/\.md$/i, ''),
                tags: data.tags,
                excerpt: excerpt || undefined
      };

      this.entryMap.set(filename, entry);
      
      // Save cache immediately
      this.saveCache();
      
      // Check capacity in background
      setTimeout(() => {
        this.scanAndSync();
      }, 1000);
    } catch (e) {
      console.error(`[OptimizedCacheManager] Failed to update file ${filename}:`, e);
    }
  }

  /**
   * Public API: Delete a post
   */
  public delete(slug: string): void {
     if (this.baseDir !== this.currentBaseDir) {
         this.scanAndSync();
     }
     
     console.log(`[OptimizedCacheManager] Deleting slug: ${slug}`);
     const candidates = MARKDOWN_EXT_RE.test(slug) ? [slug] : [`${slug}.md`, `${slug}.markdown`];
     
     // Find the actual filename
     let filename = candidates.find(c => this.entryMap.has(c));
     if (!filename) {
       filename = candidates.find(c => fs.existsSync(path.join(this.baseDir, c)));
     }
     if (!filename) {
       filename = candidates[0];
     }
     
     const fullPath = path.join(this.baseDir, filename);
     
     if (fs.existsSync(fullPath)) {
        // Move to trash using TrashManager
        TrashManager.moveToTrash([filename]);
     }
     
     this.entryMap.delete(filename);
     this.saveCache();
  }

  /**
   * Public API: Get cache statistics
   */
  public getStats(): {
    entryCount: number;
    capacityLimit: number;
    lastScanTime: number;
    cacheSize: number;
  } {
    return {
      entryCount: this.entryMap.size,
      capacityLimit: this.getCapacityLimit(),
      lastScanTime: this.lastScanTime,
      cacheSize: JSON.stringify(this.cache).length
    };
  }

  /**
   * Public API: Clear cache
   */
  public clearCache(): void {
    this.entryMap.clear();
    this.cache.entries = [];
    this.saveCache();
    console.log('[OptimizedCacheManager] Cache cleared');
  }
}

export default OptimizedMetadataCacheManager.getInstance();

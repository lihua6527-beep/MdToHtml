import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import PathManager from './path-manager';
import TrashManager from './trash-manager';
import { CacheEntry, MetadataCache } from '../types/file-system';
import { CACHE_FILE_NAME, DEFAULT_CAPACITY, CACHE_VERSION, MARKDOWN_EXT_RE } from './constants';

export class MetadataCacheManager {
  private static instance: MetadataCacheManager;
  private cache: MetadataCache;
  private entryMap: Map<string, CacheEntry>;
  private currentBaseDir: string;

  private constructor() {
    this.currentBaseDir = PathManager.getInputPath();
    
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
    // Perform initial scan
    this.scanAndSync();
  }

  public static getInstance(): MetadataCacheManager {
    if (!MetadataCacheManager.instance) {
      MetadataCacheManager.instance = new MetadataCacheManager();
    }
    return MetadataCacheManager.instance;
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
   * Load cache from disk
   */
  private loadCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const raw = fs.readFileSync(this.cachePath, 'utf8');
        const data = JSON.parse(raw) as MetadataCache;
        
        if (data.version === CACHE_VERSION) {
          this.cache = data;
          // Rebuild map for O(1) access
          this.entryMap.clear();
          data.entries.forEach(entry => {
            this.entryMap.set(entry.path, entry);
          });
        } else {
          console.log('[CacheManager] Version mismatch or invalid cache, resetting.');
        }
      } else {
          // Reset if no cache file found (e.g. new directory)
          this.entryMap.clear();
          this.cache.entries = [];
      }
    } catch (e) {
      console.warn('[CacheManager] Failed to load cache:', e);
      // Reset on error
      this.entryMap.clear();
      this.cache.entries = [];
    }
  }

  /**
   * Save cache to disk
   */
  private saveCache() {
    try {
      this.cache.lastUpdated = Date.now();
      // Ensure entries matches the map (sorted by mtime desc)
      this.cache.entries = Array.from(this.entryMap.values())
        .sort((a, b) => b.mtime - a.mtime);
      
      fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2), 'utf8');
    } catch (e) {
      console.error('[CacheManager] Failed to save cache:', e);
    }
  }

  /**
   * Core logic: Scan directory, update cache, and handle capacity
   */
  public scanAndSync() {
    try {
      // Check if path changed
      const newBaseDir = this.baseDir;
      if (newBaseDir !== this.currentBaseDir) {
          console.log(`[CacheManager] Base directory changed from ${this.currentBaseDir} to ${newBaseDir}. Reloading cache.`);
          this.currentBaseDir = newBaseDir;
          this.loadCache();
      }

      // Ensure base directory exists
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
        return;
      }

      // 1. Scan directory
      const files = fs.readdirSync(this.baseDir);
      const mdFiles = files.filter(f => 
        MARKDOWN_EXT_RE.test(f) && 
        !f.startsWith('.') && // Ignore hidden files like .metadata_cache.json
        f !== CACHE_FILE_NAME
      );

      console.log(`[CacheManager] Scanning ${mdFiles.length} files in ${this.baseDir}`);

      const currentFilesSet = new Set(mdFiles);
      let hasChanges = false;

      // 2. Update entries based on file system
      for (const file of mdFiles) {
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
              type: data.type,
              excerpt: excerpt || undefined,
            };
            
            this.entryMap.set(file, newEntry);
            hasChanges = true;
            console.log(`[CacheManager] Synced entry: ${file}`);
          }
        } catch (e) {
          console.warn(`[CacheManager] Failed to process file ${file}:`, e);
        }
      }

      // 3. Remove entries that no longer exist in FS
      const keys = Array.from(this.entryMap.keys());
      for (const key of keys) {
        if (!currentFilesSet.has(key)) {
          this.entryMap.delete(key);
          hasChanges = true;
          console.log(`[CacheManager] Removed stale entry: ${key}`);
        }
      }

      // 4. Sort and Capacity Check
      // Get current limit from config (reload if needed)
      const config = PathManager.getAppConfig();
      const currentLimit = config.capacityLimit || DEFAULT_CAPACITY;
      this.cache.capacity_limit = currentLimit; // Update cache internal state

      const sortedEntries = Array.from(this.entryMap.values())
        .sort((a, b) => b.mtime - a.mtime);
      
      if (sortedEntries.length > currentLimit) {
        // Identify overflow files
        const overflow = sortedEntries.slice(currentLimit);
        const keep = sortedEntries.slice(0, currentLimit);
        
        console.log(`[CacheManager] Capacity exceeded (${sortedEntries.length} > ${currentLimit}). Moving ${overflow.length} files to trash.`);
        
        // Move overflow to trash via TrashManager
        const overflowPaths = overflow.map(e => e.path); // Relative paths
        TrashManager.moveToTrash(overflowPaths);
        
        // Update map to only keep valid entries
        this.entryMap.clear();
        keep.forEach(e => this.entryMap.set(e.path, e));
        hasChanges = true;
      }

      if (hasChanges) {
        this.saveCache();
      }
    } catch (e) {
      console.error('[CacheManager] Scan failed:', e);
    }
  }

  /**
   * Public API: Get all cached posts
   * Returns O(1) memory reference (sorted)
   */
  public getAll(): CacheEntry[] {
    if (this.baseDir !== this.currentBaseDir) {
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
   * Public API: Get single post content (reads from disk)
   * This is a helper that uses the cache to locate, but reads content on demand.
   */
  public getPost(slug: string): { slug: string, content: string, metadata?: CacheEntry } | null {
    if (this.baseDir !== this.currentBaseDir) {
        this.scanAndSync();
    }
    const candidates = MARKDOWN_EXT_RE.test(slug) ? [slug] : [`${slug}.md`, `${slug}.markdown`];
    const filename =
      candidates.find(c => this.entryMap.has(c)) ||
      candidates.find(c => fs.existsSync(path.join(this.baseDir, c))) ||
      candidates[0];

    const entry = this.entryMap.get(filename);
    
    // If found in cache, we trust it exists (mostly).
    // If not in cache, we might still check disk just in case (e.g. newly added but not scanned yet?)
    // But for performance, we rely on cache. If not in cache, force a quick check or return null.
    // Let's force a check if not in cache, to be safe.
    
    const fullPath = path.join(this.baseDir, filename);
    if (!fs.existsSync(fullPath)) return null;

    const content = fs.readFileSync(fullPath, 'utf8');
    return {
      slug: filename.replace(MARKDOWN_EXT_RE, ''),
      content,
      metadata: entry
    };
  }

  /**
   * Public API: Update or Create a post
   * Updates cache immediately.
   */
  public update(slug: string, content: string): void {
    if (this.baseDir !== this.currentBaseDir) {
        this.scanAndSync();
    }
    // Clean slug
    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5\s_.\(\)]/g, '');
    const filename = safeSlug.endsWith('.md') ? safeSlug : `${safeSlug}.md`;
    const fullPath = path.join(this.baseDir, filename);

    // Write file
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`[CacheManager] File written: ${fullPath}`);

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
              type: data.type,
              excerpt: excerpt || undefined
    };

    this.entryMap.set(filename, entry);
    
    // Check capacity (optional here, or wait for next scan? Better to check now to keep cache clean)
    // But sorting every time might be heavy? 500 items is fine.
    // Let's trigger scanAndSync to handle capacity properly
    this.scanAndSync(); 
  }

  /**
   * Public API: Delete a post
   */
  public delete(slug: string): void {
     if (this.baseDir !== this.currentBaseDir) {
         this.scanAndSync();
     }
     console.log(`[CacheManager] Deleting slug: ${slug}`);
     const candidates = MARKDOWN_EXT_RE.test(slug) ? [slug] : [`${slug}.md`, `${slug}.markdown`];
     const filename = candidates.find(c => this.entryMap.has(c)) ||
        candidates.find(c => fs.existsSync(path.join(this.baseDir, c))) ||
        candidates[0];
     const fullPath = path.join(this.baseDir, filename);
     
     if (fs.existsSync(fullPath)) {
        // Move to trash using TrashManager with absolute path
        console.log(`[CacheManager] Moving file to trash: ${fullPath}`);
        const result = TrashManager.moveToTrash([fullPath]);
        console.log(`[CacheManager] Trash move result:`, result);
        
        if (result.failed > 0) {
            console.error(`[CacheManager] Failed to move file to trash:`, result.errors);
            throw new Error(`Failed to move file to trash: ${result.errors.join(', ')}`);
        }
     }
     
     this.entryMap.delete(filename);
     this.saveCache();
  }
}

export default MetadataCacheManager.getInstance();

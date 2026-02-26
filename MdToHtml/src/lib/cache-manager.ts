import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import PathManager from './path-manager';

const CACHE_FILE_NAME = '.metadata_cache.json';
const TRASH_DIR_NAME = '.trash';
const DEFAULT_CAPACITY = 500;
const CACHE_VERSION = '2.0';

export interface CacheEntry {
  path: string; // Filename (basename)
  mtime: number;
  status?: string;
  title?: string;
  tags?: string[];
  excerpt?: string;
  [key: string]: any;
}

export interface MetadataCache {
  version: string;
  lastUpdated: number;
  capacity_limit: number;
  entries: CacheEntry[];
}

export class MetadataCacheManager {
  private static instance: MetadataCacheManager;
  private baseDir: string;
  private cachePath: string;
  private trashDir: string;
  private cache: MetadataCache;
  private entryMap: Map<string, CacheEntry>;

  private constructor() {
    this.baseDir = PathManager.getInputPath();
    this.cachePath = path.join(this.baseDir, CACHE_FILE_NAME);
    this.trashDir = path.join(this.baseDir, TRASH_DIR_NAME);
    
    // Initialize cache structure
    this.cache = {
      version: CACHE_VERSION,
      lastUpdated: Date.now(),
      capacity_limit: DEFAULT_CAPACITY,
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
      }
    } catch (e) {
      console.warn('[CacheManager] Failed to load cache:', e);
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
      // Ensure base directory exists
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
        return;
      }

      // 1. Scan directory
      const files = fs.readdirSync(this.baseDir);
      const mdFiles = files.filter(f => 
        f.endsWith('.md') && 
        !f.startsWith('.') && // Ignore hidden files like .metadata_cache.json
        f !== CACHE_FILE_NAME
      );

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
              mtime: stats.mtimeMs,
              status: data.status,
              title: data.title || file.replace(/\.md$/i, ''),
              tags: data.tags,
              excerpt: excerpt || undefined,
            };
            
            this.entryMap.set(file, newEntry);
            hasChanges = true;
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
        }
      }

      // 4. Sort and Capacity Check
      const sortedEntries = Array.from(this.entryMap.values())
        .sort((a, b) => b.mtime - a.mtime);
      
      if (sortedEntries.length > this.cache.capacity_limit) {
        // Identify overflow files
        const overflow = sortedEntries.slice(this.cache.capacity_limit);
        const keep = sortedEntries.slice(0, this.cache.capacity_limit);
        
        // Move overflow to trash
        this.moveToTrash(overflow.map(e => e.path));
        
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
   * Move files to trash directory
   */
  private moveToTrash(files: string[]) {
    if (files.length === 0) return;

    if (!fs.existsSync(this.trashDir)) {
      fs.mkdirSync(this.trashDir, { recursive: true });
    }

    for (const file of files) {
      const src = path.join(this.baseDir, file);
      const dest = path.join(this.trashDir, file);
      try {
        if (fs.existsSync(src)) {
          // If dest exists, rename it (e.g. append timestamp) to avoid overwrite conflict?
          // For now, simple overwrite or rename if exists
          if (fs.existsSync(dest)) {
             const timestamp = Date.now();
             const ext = path.extname(file);
             const name = path.basename(file, ext);
             const newDest = path.join(this.trashDir, `${name}_${timestamp}${ext}`);
             fs.renameSync(src, newDest);
          } else {
             fs.renameSync(src, dest);
          }
          console.log(`[CacheManager] Moved ${file} to trash.`);
        }
      } catch (e) {
        console.error(`[CacheManager] Failed to move ${file} to trash:`, e);
      }
    }
  }

  /**
   * Public API: Get all cached posts
   * Returns O(1) memory reference (sorted)
   */
  public getAll(): CacheEntry[] {
    // Return sorted list
    return Array.from(this.entryMap.values()).sort((a, b) => b.mtime - a.mtime);
  }

  /**
   * Public API: Get single post content (reads from disk)
   * This is a helper that uses the cache to locate, but reads content on demand.
   */
  public getPost(slug: string): { slug: string, content: string, metadata?: CacheEntry } | null {
    // slug might be "foo" or "foo.md"
    let filename = slug;
    if (!filename.endsWith('.md')) filename += '.md';

    const entry = this.entryMap.get(filename);
    
    // If found in cache, we trust it exists (mostly).
    // If not in cache, we might still check disk just in case (e.g. newly added but not scanned yet?)
    // But for performance, we rely on cache. If not in cache, force a quick check or return null.
    // Let's force a check if not in cache, to be safe.
    
    const fullPath = path.join(this.baseDir, filename);
    if (!fs.existsSync(fullPath)) return null;

    const content = fs.readFileSync(fullPath, 'utf8');
    return {
      slug: filename.replace(/\.md$/i, ''),
      content,
      metadata: entry
    };
  }

  /**
   * Public API: Update or Create a post
   * Updates cache immediately.
   */
  public update(slug: string, content: string): void {
    // Clean slug
    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5\s_.\(\)]/g, '');
    const filename = safeSlug.endsWith('.md') ? safeSlug : `${safeSlug}.md`;
    const fullPath = path.join(this.baseDir, filename);

    // Write file
    fs.writeFileSync(fullPath, content, 'utf8');

    // Update Cache
    const stats = fs.statSync(fullPath);
    const { data, excerpt } = matter(content, { excerpt: true });
    
    const entry: CacheEntry = {
      path: filename,
      mtime: stats.mtimeMs,
      status: data.status,
      title: data.title || safeSlug.replace(/\.md$/i, ''),
      tags: data.tags,
      excerpt: excerpt || undefined
    };

    this.entryMap.set(filename, entry);
    
    // Check capacity (optional here, or wait for next scan? Better to check now to keep cache clean)
    // But sorting every time might be heavy? 500 items is fine.
    this.saveCache(); 
  }

  /**
   * Public API: Delete a post
   */
  public delete(slug: string): void {
     let filename = slug;
     if (!filename.endsWith('.md')) filename += '.md';
     const fullPath = path.join(this.baseDir, filename);
     
     if (fs.existsSync(fullPath)) {
        // Move to trash instead of permanent delete?
        // User Input says "moveToTrash" for capacity cleanup.
        // For explicit delete, maybe also move to trash?
        // Let's implement move to trash for safety.
        this.moveToTrash([filename]);
     }
     
     this.entryMap.delete(filename);
     this.saveCache();
  }
}

export default MetadataCacheManager;

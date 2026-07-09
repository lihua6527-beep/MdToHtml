/**
 * MetadataCacheManager — 元数据缓存管理器
 * 
 * 职责：
 * - 管理 input/ 目录下 .md 文件元数据缓存
 * - 提供 O(1) 的 getAll() 查询
 * - 后台异步扫描同步，不阻塞首次加载
 * 
 * 性能策略（2026-07-08 优化）：
 * - 首次加载：直接从缓存返回，不扫描磁盘
 * - 后台异步：首次返回后 setTimeout 触发异步扫描
 * - 扫描发现变化则更新缓存，下次请求生效
 * - 无变化则静默更新缓存时间戳
 */

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
  private pendingScan: boolean = false;

  private constructor() {
    this.currentBaseDir = PathManager.getInputPath();
    
    const config = PathManager.getAppConfig();
    const limit = config.capacityLimit || DEFAULT_CAPACITY;

    this.cache = {
      version: CACHE_VERSION,
      lastUpdated: Date.now(),
      capacity_limit: limit,
      entries: []
    };
    this.entryMap = new Map();

    // 第一阶段：仅加载缓存，不扫描磁盘
    this.loadCache();
    
    // 第二阶段：500ms 后后台扫描（不阻塞首屏渲染）
    setTimeout(() => {
      this.scanAndSync();
    }, 500);
  }

  public static getInstance(): MetadataCacheManager {
    if (!MetadataCacheManager.instance) {
      MetadataCacheManager.instance = new MetadataCacheManager();
    }
    return MetadataCacheManager.instance;
  }

  public reload() {
    this.scanAndSync(true);
  }

  private get baseDir(): string {
      return PathManager.getInputPath();
  }

  private get cachePath(): string {
      return path.join(this.baseDir, CACHE_FILE_NAME);
  }

  private loadCache() {
    try {
      if (fs.existsSync(this.cachePath)) {
        const raw = fs.readFileSync(this.cachePath, 'utf8');
        const data = JSON.parse(raw) as MetadataCache;
        
        if (data.version === CACHE_VERSION) {
          this.cache = data;
          this.entryMap.clear();
          data.entries.forEach(entry => {
            this.entryMap.set(entry.path, entry);
          });
          return;
        }
      }
      // 无缓存或版本不匹配
      this.entryMap.clear();
      this.cache.entries = [];
    } catch (e) {
      this.entryMap.clear();
      this.cache.entries = [];
    }
  }

  private saveCache() {
    try {
      this.cache.lastUpdated = Date.now();
      this.cache.entries = Array.from(this.entryMap.values())
        .sort((a, b) => b.mtime - a.mtime);
      fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2), 'utf8');
    } catch (e) {
      console.error('[CacheManager] 保存缓存失败:', e);
    }
  }

  /**
   * 扫描目录并同步缓存
   * 非阻塞：不直接调用，由 getAll() 触发后台调度
   */
  public scanAndSync(force: boolean = false) {
    if (this.pendingScan && !force) return;
    this.pendingScan = true;

    try {
      const newBaseDir = this.baseDir;
      if (!force && newBaseDir !== this.currentBaseDir) {
          this.currentBaseDir = newBaseDir;
          this.loadCache();
      }
      this.currentBaseDir = newBaseDir;

      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
        this.pendingScan = false;
        return;
      }

      const files = fs.readdirSync(this.baseDir);
      const mdFiles = files.filter(f => 
        MARKDOWN_EXT_RE.test(f) && 
        !f.startsWith('.') &&
        f !== CACHE_FILE_NAME
      );

      const currentFilesSet = new Set(mdFiles);
      let hasChanges = false;

      for (const file of mdFiles) {
        const fullPath = path.join(this.baseDir, file);
        try {
          const stats = fs.statSync(fullPath);
          const cached = this.entryMap.get(file);

          if (!cached || Math.abs(cached.mtime - stats.mtimeMs) > 100) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const { data, excerpt } = matter(content, { excerpt: true });
            
            this.entryMap.set(file, {
              path: file,
              slug: file.replace(MARKDOWN_EXT_RE, ''),
              mtime: stats.mtimeMs,
              birthtime: stats.birthtimeMs,
              status: data.status,
              title: data.title || file.replace(MARKDOWN_EXT_RE, ''),
              tags: data.tags,
              type: data.category || data.type,
              excerpt: excerpt || undefined,
            });
            hasChanges = true;
          }
        } catch (e) {
          console.warn(`[CacheManager] 处理文件失败 ${file}:`, e);
        }
      }

      // 移除已删除的文件
      for (const key of Array.from(this.entryMap.keys())) {
        if (!currentFilesSet.has(key)) {
          this.entryMap.delete(key);
          hasChanges = true;
        }
      }

      // 容量检查
      const config = PathManager.getAppConfig();
      const currentLimit = config.capacityLimit || DEFAULT_CAPACITY;
      this.cache.capacity_limit = currentLimit;

      const sorted = Array.from(this.entryMap.values()).sort((a, b) => b.mtime - a.mtime);
      if (sorted.length > currentLimit) {
        const overflow = sorted.slice(currentLimit);
        TrashManager.moveToTrash(overflow.map(e => e.path));
        
        this.entryMap.clear();
        sorted.slice(0, currentLimit).forEach(e => this.entryMap.set(e.path, e));
        hasChanges = true;
      }

      if (hasChanges) {
        this.saveCache();
        console.log('[CacheManager] 缓存已更新（后台扫描发现变化）');
      } else {
        // 无变化：仅更新时间戳
        this.cache.lastUpdated = Date.now();
      }
    } catch (e) {
      console.error('[CacheManager] 扫描失败:', e);
    } finally {
      this.pendingScan = false;
    }
  }

  /**
   * 获取所有缓存条目
   * 策略：先返回缓存（毫秒级），后台异步触发扫描
   */
  public getAll(): CacheEntry[] {
    // 立即返回已有缓存
    const result = Array.from(this.entryMap.values()).sort((a, b) => b.mtime - a.mtime);
    
    // 后台异步触发扫描
    if (!this.pendingScan) {
      setTimeout(() => {
        this.scanAndSync();
      }, 100);
    }
    
    return result;
  }

  public getCapacityLimit(): number {
    return PathManager.getAppConfig().capacityLimit || DEFAULT_CAPACITY;
  }

  public getPost(slug: string): { slug: string; content: string; metadata?: CacheEntry } | null {
    const candidates = MARKDOWN_EXT_RE.test(slug) ? [slug] : [`${slug}.md`, `${slug}.markdown`];
    const filename = candidates.find(c => this.entryMap.has(c)) || candidates[0];
    const entry = this.entryMap.get(filename);
    const fullPath = path.join(this.baseDir, filename);
    if (!fs.existsSync(fullPath)) return null;

    return {
      slug: filename.replace(MARKDOWN_EXT_RE, ''),
      content: fs.readFileSync(fullPath, 'utf8'),
      metadata: entry,
    };
  }

  public update(slug: string, content: string): void {
    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5\s_.\(\)]/g, '');
    const filename = safeSlug.endsWith('.md') ? safeSlug : `${safeSlug}.md`;
    const fullPath = path.join(this.baseDir, filename);
    fs.writeFileSync(fullPath, content, 'utf8');

    const stats = fs.statSync(fullPath);
    const { data, excerpt } = matter(content, { excerpt: true });
    
    this.entryMap.set(filename, {
      path: filename,
      slug: safeSlug.replace(/\.md$/i, ''),
      mtime: stats.mtimeMs,
      birthtime: stats.birthtimeMs,
      status: data.status,
      title: data.title || safeSlug.replace(/\.md$/i, ''),
      tags: data.tags,
      type: data.type,
      excerpt: excerpt || undefined,
    });
    
    this.saveCache();
    setTimeout(() => this.scanAndSync(), 200);
  }

  public delete(slug: string): void {
    const candidates = MARKDOWN_EXT_RE.test(slug) ? [slug] : [`${slug}.md`, `${slug}.markdown`];
    const filename = candidates.find(c => this.entryMap.has(c)) || candidates[0];
    const fullPath = path.join(this.baseDir, filename);
    
    if (fs.existsSync(fullPath)) {
      const result = TrashManager.moveToTrash([fullPath]);
      if (result.failed > 0) {
        throw new Error(`移动到回收站失败: ${result.errors.join(', ')}`);
      }
    }
    
    this.entryMap.delete(filename);
    this.saveCache();
  }
}

export default MetadataCacheManager.getInstance();
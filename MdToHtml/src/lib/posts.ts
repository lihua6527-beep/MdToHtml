import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import PathManager from '@/lib/path-manager';
import MetadataCacheManager from '@/lib/cache-manager';

// Use absolute path to ensure reliability across environments
const postsDirectory = PathManager.getInputPath();
const cacheManager = MetadataCacheManager;

export function getPostSlugs() {
  // Use cache manager to get valid file list
  const entries = cacheManager.getAll();
  return entries.map(e => e.path);
}

export function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.md$/i, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.md`);
  
  // Try to get status from cache first
  const cacheEntry = cacheManager.getAll().find(e => e.path.replace(/\.md$/i, '') === realSlug);
  const status = cacheEntry?.status || null;

  let historyCount = 0;
  
  if (!fs.existsSync(fullPath)) {
     // Case-insensitive fallback
     const dir = fs.readdirSync(postsDirectory);
     const match = dir.find(f => f.toLowerCase() === `${realSlug.toLowerCase()}.md`);
     if (match) {
         // Use the actual filename for data lookup too
         const actualName = match.replace(/\.md$/i, '');
         try {
             const historyPath = path.join(PathManager.getDataPath(), actualName, 'history.jsonl');
             if (fs.existsSync(historyPath)) {
                 const content = fs.readFileSync(historyPath, 'utf8');
                 historyCount = content.split('\n').filter(line => line.trim()).length;
             }
         } catch (e) {}
         
         return { slug: realSlug, content: fs.readFileSync(path.join(postsDirectory, match), 'utf8'), status, historyCount };
     }

     throw new Error(`File not found: ${fullPath}`);
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Read History Count for Scoring
  try {
      const historyPath = path.join(PathManager.getDataPath(), realSlug, 'history.jsonl');
      if (fs.existsSync(historyPath)) {
          const content = fs.readFileSync(historyPath, 'utf8');
          historyCount = content.split('\n').filter(line => line.trim()).length;
      }
  } catch (e) {
      // Ignore history read errors
  }

  return { slug: realSlug, content: fileContents, status, historyCount };
}

export function getAllPosts() {
  // Use CacheManager for O(1) access
  const entries = cacheManager.getAll();
  
  return entries.map((entry) => ({
    slug: entry.path.replace(/\.md$/i, ''),
    mtime: entry.mtime,
    birthtime: entry.birthtime || entry.mtime, // Fallback to mtime if birthtime is missing
    status: entry.status,
    title: entry.title,
    tags: entry.tags,
    excerpt: entry.excerpt
  }));
}

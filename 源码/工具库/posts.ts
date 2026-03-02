import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import PathManager from './path-manager';
import { MetadataCacheManager } from './cache-manager';
import { FileItem } from '@/types/file-system';
import { MARKDOWN_EXT_RE } from './constants';

const cacheManager = MetadataCacheManager.getInstance();

export function getPostSlugs() {
  // Use cache manager to get valid file list
  const entries = cacheManager.getAll();
  return entries.map(e => e.path);
}

export function getPostBySlug(slug: string) {
  const postsDirectory = PathManager.getInputPath();
  const realSlug = slug.replace(MARKDOWN_EXT_RE, '');
  const mdCandidate = `${realSlug}.md`;
  const markdownCandidate = `${realSlug}.markdown`;
  let matchedFilename: string | null = null;
  
  if (fs.existsSync(path.join(postsDirectory, mdCandidate))) {
    matchedFilename = mdCandidate;
  } else if (fs.existsSync(path.join(postsDirectory, markdownCandidate))) {
    matchedFilename = markdownCandidate;
  }
  
  // Try to get status from cache first
  const cacheEntry = cacheManager.getAll().find(e => e.path.replace(MARKDOWN_EXT_RE, '') === realSlug);
  const status = cacheEntry?.status || null;

  let historyCount = 0;
  
  if (!matchedFilename) {
     // Case-insensitive fallback
     const dir = fs.readdirSync(postsDirectory);
     const realSlugLower = realSlug.toLowerCase();
     const match = dir.find(f => {
        const lower = f.toLowerCase();
        return lower === `${realSlugLower}.md` || lower === `${realSlugLower}.markdown`;
     });
     if (match) {
         // Use the actual filename for data lookup too
         const actualName = match.replace(MARKDOWN_EXT_RE, '');
         try {
             const historyPath = path.join(PathManager.getDataPath(), actualName, 'history.jsonl');
             if (fs.existsSync(historyPath)) {
                 const content = fs.readFileSync(historyPath, 'utf8');
                 historyCount = content.split('\n').filter(line => line.trim()).length;
             }
         } catch (e) {}
         
         return { slug: realSlug, content: fs.readFileSync(path.join(postsDirectory, match), 'utf8'), status, historyCount };
     }

     throw new Error(`File not found: ${realSlug}`);
  }

  let fileContents = fs.readFileSync(path.join(postsDirectory, matchedFilename), 'utf8');

  // Clean up duplicate keys in frontmatter to prevent parsing errors
  try {
      const lines = fileContents.split('\n');
      let inFrontmatter = false;
      let frontmatterEnd = -1;
      const frontmatterLines: string[] = [];
      const contentLines: string[] = [];
      const seenKeys = new Set<string>();
      
      for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.trim() === '---') {
              if (!inFrontmatter) {
                  inFrontmatter = true;
                  frontmatterLines.push(line);
              } else {
                  frontmatterEnd = i;
                  frontmatterLines.push(line);
                  inFrontmatter = false;
              }
          } else if (inFrontmatter) {
              const match = line.trim().match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
              if (match) {
                  const key = match[1];
                  if (!seenKeys.has(key)) {
                      seenKeys.add(key);
                      frontmatterLines.push(line);
                  }
              } else {
                  frontmatterLines.push(line);
              }
          } else {
              contentLines.push(line);
          }
      }
      
      // Reassemble the content with cleaned frontmatter
      fileContents = [...frontmatterLines, ...contentLines].join('\n');
  } catch (e) {
      console.warn('Failed to clean up frontmatter:', e);
      // If cleanup fails, use the original content
  }

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

export function getAllPosts(): FileItem[] {
  // Use CacheManager for O(1) access
  const entries = cacheManager.getAll();
  
  return entries.map((entry) => ({
    slug: entry.path.replace(MARKDOWN_EXT_RE, ''),
    mtime: entry.mtime,
    birthtime: entry.birthtime || entry.mtime, // Fallback to mtime if birthtime is missing
    status: entry.status,
    title: entry.title,
    tags: entry.tags,
    type: entry.type,
    excerpt: entry.excerpt
  }));
}

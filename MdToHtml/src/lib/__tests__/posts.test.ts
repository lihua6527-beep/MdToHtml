import fs from 'fs';
import path from 'path';

jest.mock('fs');
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    join: jest.fn((...args) => args.join('/')), // Normalize path for testing
  };
});

// Mock MetadataCacheManager before importing posts
jest.mock('../cache-manager', () => ({
  MetadataCacheManager: {
    getInstance: jest.fn().mockReturnValue({
      getAll: jest.fn().mockReturnValue([])
    })
  }
}));

// Import posts after mocking
import { getPostSlugs, getPostBySlug, getAllPosts } from '@/lib/posts';

describe('Posts Library', () => {
  const mockPostsDirectory = '/mock/input';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock process.cwd to return a fixed path
    jest.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');
    
    // Mock MetadataCacheManager
    const { MetadataCacheManager } = require('../cache-manager');
    MetadataCacheManager.getInstance.mockReturnValue({
      getAll: jest.fn().mockReturnValue([])
    });
  });

  describe('getPostSlugs', () => {
    it('should return empty array if no files in cache', () => {
      const slugs = getPostSlugs();
      expect(slugs).toEqual([]);
    });

    it('should return all files from cache', () => {
      // Since cacheManager is initialized at module level, we need to mock it differently
      // We'll use jest.requireActual to get the real module and then modify it
      jest.resetModules();
      
      // Mock MetadataCacheManager first
      jest.mock('../cache-manager', () => ({
        MetadataCacheManager: {
          getInstance: jest.fn().mockReturnValue({
            getAll: jest.fn().mockReturnValue([
              { path: 'post1.md' },
              { path: '中文.md' }
            ])
          })
        }
      }));
      
      // Re-import posts after mocking
      const { getPostSlugs } = require('../posts');
      
      const slugs = getPostSlugs();
      expect(slugs).toEqual(['post1.md', '中文.md']);
    });
  });

  describe('getPostBySlug', () => {
    it('should return content for valid slug', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('## Content');
      
      const result = getPostBySlug('中文');
      expect(result).toEqual({
        slug: '中文',
        content: '## Content',
        status: null,
        historyCount: 1
      });
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('中文.md'), 'utf8');
    });

    it('should throw error if file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      expect(() => getPostBySlug('missing')).toThrow('File not found');
    });

    it('should handle URL encoded slug by decoding it implicitly? No, function expects decoded', () => {
        // The function assumes the slug passed is the filename (minus .md)
        // It does not decode inside getPostBySlug.
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('content');
        
        getPostBySlug('中文');
        expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('中文.md'), 'utf8');
    });
  });

  describe('getAllPosts', () => {
    it('should return all posts', () => {
      jest.resetModules();
      
      // Mock MetadataCacheManager first
      jest.mock('../cache-manager', () => ({
        MetadataCacheManager: {
          getInstance: jest.fn().mockReturnValue({
            getAll: jest.fn().mockReturnValue([
              { path: 'a.md', mtime: 1000, birthtime: 1000, status: null, title: '', tags: [], type: '', excerpt: '' },
              { path: 'b.md', mtime: 1000, birthtime: 1000, status: null, title: '', tags: [], type: '', excerpt: '' }
            ])
          })
        }
      }));
      
      // Re-import posts after mocking
      const { getAllPosts } = require('../posts');
      
      const posts = getAllPosts();
      
      expect(posts).toHaveLength(2);
      expect(posts[0]).toEqual({ slug: 'a', mtime: 1000, birthtime: 1000, status: null, title: '', tags: [], type: '', excerpt: '' });
      expect(posts[1]).toEqual({ slug: 'b', mtime: 1000, birthtime: 1000, status: null, title: '', tags: [], type: '', excerpt: '' });
    });
  });
});

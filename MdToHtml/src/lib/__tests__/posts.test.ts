import { getPostSlugs, getPostBySlug } from '@/lib/posts';
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

describe('Posts Library', () => {
  const mockPostsDirectory = '/mock/input';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock process.cwd to return a fixed path
    jest.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');
  });

  describe('getPostSlugs', () => {
    it('should return empty array if directory does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const slugs = getPostSlugs();
      expect(slugs).toEqual([]);
    });

    it('should return only .md files', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['post1.md', 'post2.txt', '中文.md']);
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
        content: '## Content'
      });
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('中文.md'), 'utf8');
    });

    it('should throw error if file does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
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
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue(['a.md', 'b.md']);
      (fs.statSync as jest.Mock).mockReturnValue({ mtimeMs: 1000 });
      
      const { getAllPosts } = require('../posts');
      const posts = getAllPosts();
      
      expect(posts).toHaveLength(2);
      expect(posts[0]).toEqual({ slug: 'a', mtime: 1000 });
      expect(posts[1]).toEqual({ slug: 'b', mtime: 1000 });
    });
  });
});

// Mock the posts library first
jest.mock('@/lib/posts', () => ({
  getPostSlugs: jest.fn(),
  getPostBySlug: jest.fn(),
}));

// Mock components to avoid ESM issues with react-markdown
jest.mock('@/components/CHD/CHDRenderer', () => ({
  CHDRenderer: () => null
}));
jest.mock('@/components/ThemeScope', () => ({
  ThemeScope: ({ children }: { children: React.ReactNode }) => children
}));

// Import React for type definitions
import React from 'react';

// Import generateStaticParams and posts after mocking
import { generateStaticParams } from '../page';
import * as posts from '@/lib/posts';

describe('generateStaticParams', () => {
  it('should return both raw and encoded slugs for Chinese filenames', async () => {
    // Setup mock return value
    (posts.getPostSlugs as jest.Mock).mockReturnValue(['示例1.md', 'english.md']);
    
    const params = await generateStaticParams();
    
    // Verify Chinese slug (Raw)
    expect(params).toContainEqual({ slug: '示例1' });
    // Verify Chinese slug (Encoded)
    expect(params).toContainEqual({ slug: encodeURIComponent('示例1') });
    
    // Verify English slug
    expect(params).toContainEqual({ slug: 'english' });
  });
});

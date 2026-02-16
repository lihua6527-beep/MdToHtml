import Page, { generateStaticParams } from '../page';
import { getPostSlugs, getPostBySlug } from '@/lib/posts';
import { render, screen } from '@testing-library/react';

// Mock dependencies
jest.mock('@/lib/posts');
jest.mock('@/components/CHD/CHDRenderer', () => ({
  CHDRenderer: ({ markdown }: { markdown: string }) => <div data-testid="renderer">{markdown}</div>,
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('Dynamic Slug Page', () => {
  describe('generateStaticParams', () => {
    it('should return decoded slugs', async () => {
      (getPostSlugs as jest.Mock).mockReturnValue(['test.md', '中文.md']);
      const params = await generateStaticParams();
      expect(params).toEqual(expect.arrayContaining([
        { slug: 'test' },
        { slug: '中文' },
        { slug: encodeURIComponent('中文') }
      ]));
    });
  });

  describe('Page Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render content for valid decoded slug', () => {
      (getPostBySlug as jest.Mock).mockReturnValue({ content: '# Hello' });
      render(<Page params={{ slug: 'test' }} />);
      expect(screen.getByTestId('renderer')).toHaveTextContent('# Hello');
      expect(getPostBySlug).toHaveBeenCalledWith('test');
    });

    it('should render content for encoded Chinese slug (fix verification)', () => {
      (getPostBySlug as jest.Mock).mockReturnValue({ content: '# 你好' });
      // Simulate browser sending encoded slug
      const encodedSlug = encodeURIComponent('中文');
      render(<Page params={{ slug: encodedSlug }} />);
      expect(screen.getByTestId('renderer')).toHaveTextContent('# 你好');
      // Verify it called getPostBySlug with DECODED slug
      expect(getPostBySlug).toHaveBeenCalledWith('中文');
    });

    it('should handle error when file not found', () => {
      (getPostBySlug as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });
      render(<Page params={{ slug: 'missing' }} />);
      expect(screen.getByTestId('renderer')).toHaveTextContent('# 错误 未找到文件: missing 原始标识: missing');
    });
  });
});

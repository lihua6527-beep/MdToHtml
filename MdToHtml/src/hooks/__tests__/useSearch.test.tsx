/**
 * useSearch — Fuse.js 全文搜索 Hook
 *
 * 索引字段：title(0.5) / tags(0.3) / filename(0.1) / brief(0.1) / subtitle(0.05)
 */
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';
import type { FileItem } from '@/types/file-system';

const docs = [
  {
    slug: 'alpha-report',
    title: '注意力机制综述',
    tags: ['论文', 'NLP'],
    excerpt: '关于注意力机制的综述内容',
    mtime: 1,
    birthtime: 1,
  },
  {
    slug: 'beta-manual',
    title: '缓存优化手册',
    tags: ['知识'],
    excerpt: 'LRU 缓存与索引优化',
    mtime: 2,
    birthtime: 2,
  },
] as unknown as FileItem[];

describe('useSearch', () => {
  it('初始状态返回全部文档且查询为空', () => {
    const { result } = renderHook(() => useSearch(docs));

    expect(result.current.query).toBe('');
    expect(result.current.results).toHaveLength(2);
  });

  it('按标题关键词命中对应文档', () => {
    const { result } = renderHook(() => useSearch(docs));

    act(() => result.current.search('注意力'));

    expect(result.current.results.map((d) => d.slug)).toContain('alpha-report');
  });

  it('按文件名（slug）可命中', () => {
    const { result } = renderHook(() => useSearch(docs));

    act(() => result.current.search('beta-manual'));

    expect(result.current.results.map((d) => d.slug)).toContain('beta-manual');
  });

  it('按标签可命中', () => {
    const { result } = renderHook(() => useSearch(docs));

    act(() => result.current.search('NLP'));

    expect(result.current.results.map((d) => d.slug)).toContain('alpha-report');
  });

  it('查询为空字符串时回到全量结果', () => {
    const { result } = renderHook(() => useSearch(docs));

    act(() => result.current.search('注意力'));
    expect(result.current.results.length).toBeLessThan(2);

    act(() => result.current.search(''));
    expect(result.current.results).toHaveLength(2);
  });

  it('纯空白查询也回到全量结果', () => {
    const { result } = renderHook(() => useSearch(docs));

    act(() => result.current.search('   '));

    expect(result.current.query).toBe('   ');
    expect(result.current.results).toHaveLength(2);
  });

  it('无匹配时返回空数组', () => {
    const { result } = renderHook(() => useSearch(docs));

    act(() => result.current.search('zzzzzzzz-不存在的内容'));

    expect(result.current.results).toEqual([]);
  });

  it('clearSearch 清空查询与结果过滤状态', () => {
    const { result } = renderHook(() => useSearch(docs));

    act(() => result.current.search('注意力'));
    act(() => result.current.clearSearch());

    expect(result.current.query).toBe('');
    expect(result.current.results).toHaveLength(2);
  });

  it('文档列表变化时重建索引（新文档可被搜到）', () => {
    const { result, rerender } = renderHook(({ items }) => useSearch(items), {
      initialProps: { items: docs },
    });

    const extended = [
      ...docs,
      { slug: 'gamma-note', title: '增量文档', tags: [], excerpt: '', mtime: 3, birthtime: 3 },
    ] as unknown as FileItem[];

    rerender({ items: extended });
    act(() => result.current.search('增量文档'));

    expect(result.current.results.map((d) => d.slug)).toContain('gamma-note');
  });
});

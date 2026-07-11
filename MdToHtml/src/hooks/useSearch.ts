import Fuse from 'fuse.js';
import { useMemo, useState, useCallback } from 'react';
import type { FileItem } from '@/types/file-system';

interface SearchableDocument {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  brief: string;
  filename: string;
}

interface UseSearchReturn {
  query: string;
  results: FileItem[];
  search: (q: string) => void;
  clearSearch: () => void;
}

export function useSearch(documents: FileItem[]): UseSearchReturn {
  const fuse = useMemo(() => {
    const searchableDocs: SearchableDocument[] = documents.map(doc => ({
      id: doc.slug,
      title: doc.title || doc.slug || '',
      subtitle: doc.subtitle || '',
      tags: doc.tags || [],
      brief: doc.excerpt || doc.brief || '',
      filename: doc.slug,
    }));

    return new Fuse(searchableDocs, {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'tags', weight: 0.3 },
        { name: 'filename', weight: 0.1 },
        { name: 'brief', weight: 0.1 },
        { name: 'subtitle', weight: 0.05 },
      ],
      threshold: 0.4,
      distance: 100,
      includeMatches: true,
      minMatchCharLength: 1,
    });
  }, [documents]);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileItem[]>(documents);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults(documents);
      return;
    }

    try {
      const fuseResults = fuse.search(q);
      const matched = fuseResults
        .map(r => documents.find(d => d.slug === r.item.id))
        .filter((item): item is FileItem => item !== undefined);
      setResults(matched);
    } catch (e) {
      // 降级：前缀匹配
      console.warn('Fuse.js search error, falling back to prefix match', e);
      const lowerQuery = q.toLowerCase();
      const fallbackResults = documents.filter(d =>
        d.slug.toLowerCase().includes(lowerQuery) ||
        (d.title || '').toLowerCase().includes(lowerQuery) ||
        (d.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery))
      );
      setResults(fallbackResults);
    }
  }, [fuse, documents]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(documents);
  }, [documents]);

  return { query, results, search, clearSearch };
}


import { useEffect } from 'react';

export function useVisitHistory(slug: string) {
  useEffect(() => {
    try {
        const visitedStr = localStorage.getItem('visited_docs');
        const visitedMap = visitedStr ? JSON.parse(visitedStr) : {};
        
        visitedMap[slug] = Date.now();
        localStorage.setItem('visited_docs', JSON.stringify(visitedMap));
    } catch (e) {
        console.error('Failed to update visit history', e);
    }
  }, [slug]);
}

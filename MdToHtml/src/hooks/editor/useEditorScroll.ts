import { useRef, useImperativeHandle, RefObject } from 'react';

export interface MarkdownEditorHandle {
  scrollToLine: (line: number) => void;
}

interface UseEditorScrollProps {
  ref: React.Ref<MarkdownEditorHandle>;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
}

export const useEditorScroll = ({ ref, onScroll }: UseEditorScrollProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    scrollToLine: (line: number) => {
      if (textareaRef.current) {
        const lineHeight = 24; // Approximation for text-sm leading-relaxed
        const targetScroll = (line - 1) * lineHeight;
        
        textareaRef.current.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }
  }));

  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = textareaRef.current;
    if (onScroll) {
      onScroll(scrollTop, scrollHeight, clientHeight);
    }
  };

  return {
    textareaRef,
    handleScroll
  };
};

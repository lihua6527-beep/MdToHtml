import { useState, useEffect, useRef, useCallback } from 'react';
import { useHistory } from './useHistory';
import { useMarkdownInteraction } from './useMarkdownInteraction';
import { useScoring } from './useScoring';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { FileService } from '@/services/FileService';
import matter from 'gray-matter';

interface UseDocumentStateProps {
  initialContent: string;
  decodedSlug: string;
  initialStatus?: string | null;
  historyCount?: number;
}

interface UseDocumentStateReturn {
  // Content state
  content: string;
  setContent: (content: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Edit state
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  selectedBlockIndex: number | null;
  setSelectedBlockIndex: (index: number | null) => void;
  
  // Save state
  isSaving: boolean;
  saveSuccess: boolean;
  saveFile: (silent?: boolean, contentOverride?: string) => Promise<void>;
  handleSave: () => Promise<void>;
  
  // Export state
  isExporting: boolean;
  setIsExporting: (isExporting: boolean) => void;
  
  // Document type state
  documentType: string;
  showTypeDropdown: boolean;
  setShowTypeDropdown: (show: boolean) => void;
  handleTypeChange: (newType: string) => void;
  
  // Status state
  docStatus: string | null;
  isStatusUpdating: boolean;
  handleStatusChange: (newStatus: string) => void;
  
  // Frontmatter
  frontmatter: any;
  
  // Markdown interaction
  updateAttribute: (blockIndex: number, key: string, value: any) => void;
  updateContent: (blockIndex: number, content: string) => void;
  updateTitle: (blockIndex: number, title: string) => void;
  updateFrontmatter: (updates: Record<string, any> | string, value?: any) => void;
  moveCard: (blockIndex: number, direction: 'left' | 'right' | 'up' | 'down') => void;
  deleteCard: (blockIndex: number) => void;
  addCard: (blockIndex: number) => void;
  batchUpdateAttributes: (updates: Array<{blockIndex: number, key: string, value: any}>) => void;
  
  // Scoring
  scoreResult: any;
  showScoreDetails: boolean;
  setShowScoreDetails: (show: boolean) => void;
  
  // Navigation
  handleBack: () => void;
}

export const useDocumentState = ({
  initialContent,
  decodedSlug,
  initialStatus = null,
  historyCount = 0
}: UseDocumentStateProps): UseDocumentStateReturn => {
  const { toast } = useToast();
  const router = useRouter();
  
  // Content state management
  const { 
    state: content, 
    pushState: setContent, 
    undo, 
    redo, 
    canUndo, 
    canRedo 
  } = useHistory(initialContent, { sessionId: decodedSlug });
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  
  // Status state
  const [docStatus, setDocStatus] = useState<string | null>(initialStatus || null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  
  // Document type state
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  
  // Refs
  const triggerSaveRef = useRef<((content: string) => void) | null>(null);
  const isSavingRef = useRef(false);
  const contentRef = useRef(content);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update ref when content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  
  // Wrapper for content updates to ensure auto-save works even in View Mode
  const handleContentUpdate = useCallback((newContent: string) => {
    setContent(newContent);
    // Trigger save for all content updates, including in edit mode
    triggerSaveRef.current?.(newContent);
  }, [setContent]);
  
  // Markdown interaction
  const { 
    updateAttribute, 
    updateContent, 
    updateTitle, 
    updateFrontmatter, 
    moveCard, 
    deleteCard, 
    addCard, 
    operationLog, 
    batchUpdateAttributes 
  } = useMarkdownInteraction(content, handleContentUpdate);
  
  // Parse Frontmatter for Global Settings
  const frontmatter = useRef<any>({});
  
  // Real-time Scoring
  // Combine initial history count with current session operations for immediate feedback
  const effectiveHistoryCount = historyCount + operationLog.length;
  const { scoreResult, showScoreDetails, setShowScoreDetails } = useScoring(content, effectiveHistoryCount);
  
  // Get document type from frontmatter
  const documentType = useRef('project');
  
  // Parse frontmatter with error handling
  useEffect(() => {
    try {
      // First, try to parse normally
      const { data } = matter(content);
      frontmatter.current = data || {};
      documentType.current = frontmatter.current.type || 'project';
    } catch (e) {
      console.warn('Frontmatter parsing failed, attempting to clean up duplicate keys', e);
      // If parsing fails due to duplicate keys, clean up the content
      try {
        const lines = content.split('\n');
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
        const cleanedContent = [...frontmatterLines, ...contentLines].join('\n');
        const { data } = matter(cleanedContent);
        frontmatter.current = data || {};
        documentType.current = frontmatter.current.type || 'project';
      } catch (e2) {
        console.warn('Failed to clean up frontmatter', e2);
        frontmatter.current = {};
        documentType.current = 'project';
      }
    }
  }, [content]);
  
  // Clear selection when exiting edit mode
  useEffect(() => {
    if (!isEditing) {
      setSelectedBlockIndex(null);
    }
  }, [isEditing]);
  
  // Click outside to close type dropdown
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTypeDropdown(false);
    };

    if (showTypeDropdown) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [showTypeDropdown]);
  
  // Debounced save function
  const debouncedSave = useCallback(async (
    slug: string, 
    contentToSave: string, 
    initialContent: string, 
    operationLog: any[], 
    router: any
  ) => {
    isSavingRef.current = true;
    setIsSaving(true);
    try {
      console.log('Executing save for:', slug);
      // Unified Save Logic using FileService
      const success = await FileService.saveFile(slug, contentToSave, operationLog);

      if (success) {
        console.log('Save successful');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        router.refresh();
      } else {
        console.error('Save failed');
      }
    } catch(e) {
      console.error('Save error:', e);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, []);
  
  // Debounce wrapper
  const triggerDebouncedSave = useCallback((newContent: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    // Set saving state immediately to block navigation
    isSavingRef.current = true;
    setIsSaving(true);

    saveTimeoutRef.current = setTimeout(() => {
      debouncedSave(decodedSlug, newContent, initialContent, operationLog, router);
    }, 500);
  }, [decodedSlug, initialContent, operationLog, router, debouncedSave]);
  
  // Keep triggerSaveRef up to date
  useEffect(() => {
    triggerSaveRef.current = triggerDebouncedSave;
  }, [triggerDebouncedSave]);
  
  const saveFile = useCallback(async (silent = false, contentOverride?: string) => {
    // Legacy direct save, kept for manual save button if needed
    const contentToSave = contentOverride || contentRef.current;
    await debouncedSave(decodedSlug, contentToSave, initialContent, operationLog, router);
  }, [decodedSlug, initialContent, operationLog, router, debouncedSave]);
  
  // Auto-save
  useEffect(() => {
    if (!isEditing || !content) return;

    const timer = setTimeout(() => {
      saveFile(true); // Silent save
    }, 5000); // 5 seconds debounce

    return () => clearTimeout(timer);
  }, [content, isEditing, saveFile]);
  
  const handleSave = useCallback(async () => {
    await saveFile(false);
    setIsEditing(false); // Exit edit mode after save
  }, [saveFile]);
  
  const handleStatusChange = useCallback((newStatus: string) => {
    // Prevent rapid clicks
    if (isStatusUpdating) return;
    
    // 1. Immediately update UI state (Optimistic)
    setDocStatus(newStatus);
    setIsStatusUpdating(true);

    // 2. Update via robust updateFrontmatter (batch update)
    // Use setTimeout to allow UI to render the loading state first
    setTimeout(() => {
      const isDone = ['done', 'completed'].includes(newStatus);
      
      updateFrontmatter({
        status: newStatus,
        training_sample: isDone
      });
      
      // Keep loading state for a moment to provide visual feedback
      setTimeout(() => {
        setIsStatusUpdating(false);
      }, 800);
    }, 50);
    
    // Note: triggerDebouncedSave is handled by handleContentUpdate wrapper passed to useMarkdownInteraction
  }, [isStatusUpdating, updateFrontmatter]);
  
  const handleTypeChange = useCallback((newType: string) => {
    // 1. 立即更新UI状态（乐观更新）
    updateFrontmatter({
      type: newType
    });
    
    // 2. 关闭下拉菜单
    setShowTypeDropdown(false);
  }, [updateFrontmatter]);
  
  const handleBack = useCallback(() => {
    if (isSavingRef.current) {
      // Wait for save to complete
      const checkSave = setInterval(() => {
        if (!isSavingRef.current) {
          clearInterval(checkSave);
          router.push('/');
        }
      }, 100);
    } else {
      router.push('/');
    }
  }, [router]);
  
  return {
    // Content state
    content,
    setContent,
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Edit state
    isEditing,
    setIsEditing,
    selectedBlockIndex,
    setSelectedBlockIndex,
    
    // Save state
    isSaving,
    saveSuccess,
    saveFile,
    handleSave,
    
    // Export state
    isExporting,
    setIsExporting,
    
    // Document type state
    documentType: documentType.current,
    showTypeDropdown,
    setShowTypeDropdown,
    handleTypeChange,
    
    // Status state
    docStatus,
    isStatusUpdating,
    handleStatusChange,
    
    // Frontmatter
    frontmatter: frontmatter.current,
    
    // Markdown interaction
    updateAttribute,
    updateContent,
    updateTitle,
    updateFrontmatter,
    moveCard,
    deleteCard,
    addCard,
    batchUpdateAttributes,
    
    // Scoring
    scoreResult,
    showScoreDetails,
    setShowScoreDetails,
    
    // Navigation
    handleBack
  };
};

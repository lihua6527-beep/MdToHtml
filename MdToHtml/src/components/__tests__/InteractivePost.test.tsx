import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InteractivePost from '../InteractivePost';
import { useMarkdownInteraction } from '@/hooks/useMarkdownInteraction';

// Mock dependencies
jest.mock('next/link', () => {
  const MockLink = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  MockLink.displayName = 'Link';
  return MockLink;
});
jest.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  Edit: () => <span data-testid="icon-edit" />,
  Save: () => <span data-testid="icon-save" />,
  Eye: () => <span data-testid="icon-eye" />,
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  Layout: () => <span data-testid="icon-layout" />,
  CheckCircle: () => <span data-testid="icon-check-circle" />,
  AlertTriangle: () => <span data-testid="icon-alert-triangle" />,
  X: () => <span data-testid="icon-x" />,
}));
jest.mock('@/components/CHD/CHDRenderer', () => ({
  CHDRenderer: ({ markdown, editMode }: any) => (
    <div data-testid="chd-renderer">
      <div>{markdown}</div>
      {editMode && <span data-testid="edit-mode-indicator">Edit Mode Active</span>}
    </div>
  ),
}));
jest.mock('@/hooks/useMarkdownInteraction', () => ({
  useMarkdownInteraction: jest.fn(),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant }: any) => (
    <button onClick={onClick} data-testid={`button-${variant || 'default'}`}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ThemeSwitcher', () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher">ThemeSwitcher</div>,
}));

// Mock fetch
global.fetch = jest.fn();

describe('InteractivePost', () => {
  const mockInitialContent = '# Hello World';
  const mockSlug = 'hello-world';
  const mockDecodedSlug = 'Hello World';
  
  const mockUpdateAttribute = jest.fn();
  const mockUpdateContent = jest.fn();
  const mockUpdateTitle = jest.fn();
  const mockMoveCard = jest.fn();
  const mockDeleteCard = jest.fn();
  const mockAddCard = jest.fn();
  const mockUndo = jest.fn();

  beforeEach(() => {
    (useMarkdownInteraction as jest.Mock).mockReturnValue({
      updateAttribute: mockUpdateAttribute,
      updateContent: mockUpdateContent,
      updateTitle: mockUpdateTitle,
      moveCard: mockMoveCard,
      deleteCard: mockDeleteCard,
      addCard: mockAddCard,
      undo: mockUndo,
      canUndo: true,
    });
    jest.clearAllMocks();
  });

  it('renders initial content and decoded slug', () => {
    render(
      <InteractivePost 
        initialContent={mockInitialContent} 
        slug={mockSlug} 
        decodedSlug={mockDecodedSlug} 
      />
    );

    expect(screen.getByText(mockDecodedSlug)).toBeInTheDocument();
    expect(screen.getByText(mockInitialContent)).toBeInTheDocument();
    expect(screen.getByText('编辑页面')).toBeInTheDocument();
  });

  it('toggles edit mode correctly', () => {
    render(
      <InteractivePost 
        initialContent={mockInitialContent} 
        slug={mockSlug} 
        decodedSlug={mockDecodedSlug} 
      />
    );

    const editButton = screen.getByText('编辑页面');
    fireEvent.click(editButton);

    expect(screen.getByTestId('edit-mode-indicator')).toBeInTheDocument();
    expect(screen.getByText('保存修改')).toBeInTheDocument();
    expect(screen.getByText('取消/预览')).toBeInTheDocument();

    const cancelButton = screen.getByText('取消/预览');
    fireEvent.click(cancelButton);

    expect(screen.queryByTestId('edit-mode-indicator')).not.toBeInTheDocument();
  });

  it('handles save functionality', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    window.alert = jest.fn();

    render(
      <InteractivePost 
        initialContent={mockInitialContent} 
        slug={mockSlug} 
        decodedSlug={mockDecodedSlug} 
      />
    );

    // Enter edit mode
    fireEvent.click(screen.getByText('编辑页面'));

    // Click save
    const saveButton = screen.getByText('保存修改');
    fireEvent.click(saveButton);

    expect(screen.getByText('保存中...')).toBeInTheDocument();

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/save', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining(mockDecodedSlug)
        }));
    });

    expect(window.alert).toHaveBeenCalledWith('保存并归档成功');
    // Should exit edit mode
    await waitFor(() => {
        expect(screen.queryByTestId('edit-mode-indicator')).not.toBeInTheDocument();
    });
  });

  it('handles save error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    window.alert = jest.fn();

    render(
      <InteractivePost 
        initialContent={mockInitialContent} 
        slug={mockSlug} 
        decodedSlug={mockDecodedSlug} 
      />
    );

    fireEvent.click(screen.getByText('编辑页面'));
    fireEvent.click(screen.getByText('保存修改'));

    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('保存失败');
    });
    
    // Should still be in edit mode
    expect(screen.getByTestId('edit-mode-indicator')).toBeInTheDocument();
  });
});

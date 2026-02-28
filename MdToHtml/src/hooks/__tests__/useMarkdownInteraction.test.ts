import { renderHook, act } from '@testing-library/react';
import { useMarkdownInteraction } from '../useMarkdownInteraction';

describe('useMarkdownInteraction', () => {
  const initialMarkdown = `---
title: Test
---

## Section 1 {layout="grid"}

### Card 1 {col-span=1}
Content 1

### Card 2 {col-span=2}
Content 2
`;

  it('should update attribute correctly', () => {
    let currentMarkdown = initialMarkdown;
    const setMarkdown = jest.fn((newMd) => { currentMarkdown = newMd; });
    
    const { result } = renderHook(() => useMarkdownInteraction(currentMarkdown, setMarkdown));

    // Blocks:
    // 0: Frontmatter
    // 1: Section 1
    // 2: Card 1
    // 3: Card 2
    
    // Update Card 1 attribute: col-span=2
    act(() => {
      result.current.updateAttribute(2, 'col-span', 2);
    });

    expect(setMarkdown).toHaveBeenCalled();
    expect(currentMarkdown).toContain('### Card 1 {col-span=2}');
  });

  it('should update content correctly', () => {
    let currentMarkdown = initialMarkdown;
    const setMarkdown = jest.fn((newMd) => { currentMarkdown = newMd; });
    
    const { result } = renderHook(() => useMarkdownInteraction(currentMarkdown, setMarkdown));

    // Update Card 2 content
    const newContent = 'New Text Value';
    act(() => {
      result.current.updateContent(3, newContent);
    });

    expect(setMarkdown).toHaveBeenCalled();
    expect(currentMarkdown).toContain(newContent);
    expect(currentMarkdown).not.toContain('Content 2');
  });

  it('should update title correctly', () => {
    let currentMarkdown = initialMarkdown;
    const setMarkdown = jest.fn((newMd) => { currentMarkdown = newMd; });
    
    const { result } = renderHook(() => useMarkdownInteraction(currentMarkdown, setMarkdown));

    // Update Card 1 title
    const newTitle = 'Updated Title';
    act(() => {
      result.current.updateTitle(2, newTitle);
    });

    expect(setMarkdown).toHaveBeenCalled();
    expect(currentMarkdown).toContain('### Updated Title {col-span=1}');
  });

  it('should move card correctly (swap with previous)', () => {
    let currentMarkdown = initialMarkdown;
    const setMarkdown = jest.fn((newMd) => { currentMarkdown = newMd; });
    
    const { result } = renderHook(() => useMarkdownInteraction(currentMarkdown, setMarkdown));

    // Move Card 2 (index 3) left/up -> should swap with Card 1 (index 2)
    act(() => {
      result.current.moveCard(3, 'left');
    });

    expect(setMarkdown).toHaveBeenCalled();
    
    // After swap, Card 2 should appear before Card 1 in the markdown string
    const card1Index = currentMarkdown.indexOf('### Card 1');
    const card2Index = currentMarkdown.indexOf('### Card 2');
    
    expect(card2Index).toBeLessThan(card1Index);
  });

  it('should delete card correctly', () => {
    let currentMarkdown = initialMarkdown;
    const setMarkdown = jest.fn((newMd) => { currentMarkdown = newMd; });
    
    const { result } = renderHook(() => useMarkdownInteraction(currentMarkdown, setMarkdown));

    // Delete Card 1 (index 2)
    act(() => {
      result.current.deleteCard(2);
    });

    expect(setMarkdown).toHaveBeenCalled();
    expect(currentMarkdown).not.toContain('### Card 1');
    expect(currentMarkdown).toContain('### Card 2');
  });

  it('should add card correctly', () => {
    let currentMarkdown = initialMarkdown;
    const setMarkdown = jest.fn((newMd) => { currentMarkdown = newMd; });
    
    const { result } = renderHook(() => useMarkdownInteraction(currentMarkdown, setMarkdown));

    // Add card to Section 1 (index 1)
    act(() => {
      result.current.addCard(1);
    });

    expect(setMarkdown).toHaveBeenCalled();
    expect(currentMarkdown).toContain('### New Card');
  });

  it('should undo changes', () => {
    let currentMarkdown = initialMarkdown;
    const setMarkdown = jest.fn((newMd) => { currentMarkdown = newMd; });
    
    const { result, rerender } = renderHook(({ markdown, onUpdate }) => useMarkdownInteraction(markdown, onUpdate), {
        initialProps: { markdown: initialMarkdown, onUpdate: setMarkdown }
    });

    // 1. Make a change
    act(() => {
      result.current.updateContent(3, 'Changed Content');
    });

    expect(setMarkdown).toHaveBeenCalled();
    expect(currentMarkdown).toContain('Changed Content');

    // Update the hook props with the new markdown (simulating parent re-render)
    rerender({ markdown: currentMarkdown, onUpdate: setMarkdown });

    // 2. Check canUndo
    expect(result.current.canUndo).toBe(true);

    // 3. Undo
    act(() => {
      result.current.undo();
    });

    expect(setMarkdown).toHaveBeenCalledTimes(2); // Once for update, once for undo
    // The last call to setMarkdown should restore the previous state (initialMarkdown)
    expect(setMarkdown).toHaveBeenLastCalledWith(initialMarkdown);
  });
});

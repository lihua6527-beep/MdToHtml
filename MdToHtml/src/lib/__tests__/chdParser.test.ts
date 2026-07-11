import { parseCHDBlocks, parseCHDBlocksWithDiagnostics } from '../chdParser';

describe('parseCHDBlocks', () => {
  // === 正常解析 ===
  it('should parse sections and cards', () => {
    const markdown = `
## Section 1
### Card 1
Content 1
`;
    const blocks = parseCHDBlocks(markdown);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('section');
    expect(blocks[1].type).toBe('card');
  });

  it('should parse code blocks', () => {
    const markdown = `
## Section 1
### Card 1
Before code
\`\`\`typescript
const x = 1;
\`\`\`
After code
## Section 2
`;
    const blocks = parseCHDBlocks(markdown);

    expect(blocks.length).toBe(3);
    expect(blocks[0].type).toBe('section');
    expect(blocks[1].type).toBe('card');
    expect(blocks[1].id).toMatch(/^card-/);
    expect(blocks[2].type).toBe('section');
  });

  it('should handle code blocks with directory structure', () => {
    const markdown = `
### Directory
\`\`\`
/src
  /components
\`\`\`
`;
    const blocks = parseCHDBlocks(markdown);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('card');
    expect(blocks[0].title).toBe('Directory');
  });

  // === Phase 1: 安全兜底 ===
  it('should use content hash ID that is stable across line insertions', () => {
    const markdown1 = `
## Architecture
### Component A
Details
`;
    const markdown2 = `
Intro line
## Architecture
### Component A
Details
`;
    const blocks1 = parseCHDBlocks(markdown1);
    const blocks2 = parseCHDBlocks(markdown2);

    // Section "Architecture" 的 ID 应该相同（标题不变）
    expect(blocks1[0].id).toBe(blocks2[0].id);
    // Card "Component A" 的 ID 应该相同
    expect(blocks1[1].id).toBe(blocks2[1].id);
  });

  it('should handle empty section title with placeholder', () => {
    const markdown = `## 
Content under empty section`;
    const blocks = parseCHDBlocks(markdown);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('section');
    expect(blocks[0].title).toBe('未命名章节');
  });

  it('should handle empty card title with placeholder', () => {
    const markdown = `### 
Content under empty card`;
    const blocks = parseCHDBlocks(markdown);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('card');
    expect(blocks[0].title).toBe('未命名卡片');
  });

  // === Phase 2: 错误恢复 ===
  it('should gracefully handle unclosed code block', () => {
    const markdown = `
## Section 1
\`\`\`python
print("hello")
`;
    const result = parseCHDBlocksWithDiagnostics(markdown);
    expect(result.diagnostics.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.diagnostics.errors[0].message).toContain('未闭合');
    // 解析不崩溃，至少返回一个 section
    const sections = result.blocks.filter(b => b.type === 'section');
    expect(sections.length).toBe(1);
  });

  it('should gracefully handle unclosed frontmatter', () => {
    const markdown = `---
title: test
subtitle: hello
`;
    const result = parseCHDBlocksWithDiagnostics(markdown);
    expect(result.diagnostics.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.diagnostics.errors[0].message).toContain('Frontmatter');
    // 解析不崩溃
    expect(Array.isArray(result.blocks)).toBe(true);
  });

  it('should detect double nesting code block within card', () => {
    const markdown = `
### Card
\`\`\`
code block 1
\`\`\`
\`\`\`
code block 2
\`\`\`
`;
    const result = parseCHDBlocksWithDiagnostics(markdown);
    // 代码块在 card 中被吸收，不产生错误
    expect(result.diagnostics.errorCount).toBe(0);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].type).toBe('card');
  });

  it('should handle special characters in titles gracefully', () => {
    const markdown = `## Hello $&_世界`;
    const blocks = parseCHDBlocks(markdown);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('section');
    expect(blocks[0].id).toContain('hello');
  });

  it('should return empty array for empty input', () => {
    const blocks = parseCHDBlocks('');
    expect(blocks).toHaveLength(0);
  });

  it('should handle frontmatter with content', () => {
    const markdown = `---
title: My Doc
tags: [dev, react]
---

## Section 1
Some content
`;
    const blocks = parseCHDBlocks(markdown);
    expect(blocks[0].type).toBe('frontmatter');
    expect(blocks[1].type).toBe('section');
  });

  it('should handle standalone code block (not in card)', () => {
    const markdown = `
\`\`\`json
{"key": "value"}
\`\`\`
`;
    const blocks = parseCHDBlocks(markdown);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('code');
  });

  it('should parse diagnostics correctly', () => {
    const markdown = `## Section 1\n### Card 1\nContent`;
    const result = parseCHDBlocksWithDiagnostics(markdown);
    expect(result.diagnostics.parseTime).toBeGreaterThanOrEqual(0);
    expect(result.diagnostics.totalLines).toBe(3);
    expect(result.diagnostics.errorCount).toBe(0);
    expect(result.diagnostics.incomplete).toBe(false);
    expect(result.blocks).toHaveLength(2);
  });
});
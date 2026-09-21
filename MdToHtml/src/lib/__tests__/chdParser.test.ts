
import { parseCHDBlocks } from '../chdParser';

describe('parseCHDBlocks', () => {
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
    
    // 1. Section 1
    // 2. Card 1 (code block inside card is absorbed into card block)
    // 3. Section 2
    
    // Note: Code blocks inside or immediately after card scope are absorbed into the card block
    expect(blocks.length).toBe(3);
    
    expect(blocks[0].type).toBe('section');
    expect(blocks[1].type).toBe('card');
    // id 基于行号自动生成
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
    // Code block immediately after a card is absorbed into the card scope
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('card');
    expect(blocks[0].title).toBe('Directory');
  });
});

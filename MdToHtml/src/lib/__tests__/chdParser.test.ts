
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
    // 2. Card 1
    // 3. Code Block
    // 4. Section 2
    
    expect(blocks.length).toBeGreaterThanOrEqual(4);
    
    const codeBlock = blocks.find(b => b.type === 'code');
    expect(codeBlock).toBeDefined();
    expect(codeBlock?.title).toBe('typescript');
    expect(codeBlock?.level).toBe(2);
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
    expect(blocks).toHaveLength(2);
    expect(blocks[1].type).toBe('code');
    expect(blocks[1].title).toBe('');
  });
});

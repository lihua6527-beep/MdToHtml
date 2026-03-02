
export interface CHDBlock {
  type: 'section' | 'card' | 'frontmatter' | 'code';
  startLine: number;
  endLine: number;
  title: string;
  level: number; // 0=frontmatter, 1=section(##), 2=card(###)/code
  id: string; // unique id based on content or index
}

export function parseCHDBlocks(markdown: string): CHDBlock[] {
  const lines = markdown.split('\n');
  const blocks: CHDBlock[] = [];
  
  let currentBlock: CHDBlock | null = null;
  let inFrontmatter = false;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Frontmatter detection
    if (i === 0 && trimmed === '---') {
      inFrontmatter = true;
      currentBlock = {
        type: 'frontmatter',
        startLine: i,
        endLine: i,
        title: 'Metadata',
        level: 0,
        id: 'frontmatter'
      };
      continue;
    }
    
    if (inFrontmatter) {
      if (trimmed === '---') {
        inFrontmatter = false;
        if (currentBlock) {
            currentBlock.endLine = i;
            blocks.push(currentBlock);
            currentBlock = null;
        }
      } else if (currentBlock) {
          currentBlock.endLine = i;
      }
      continue;
    }

    // Code Block Detection (```)
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        if (currentBlock) {
          currentBlock.endLine = i - 1; // Exclude closing ```
          blocks.push(currentBlock);
          currentBlock = null;
        }
        inCodeBlock = false;
      } else {
        // Start of code block
        if (currentBlock) {
          currentBlock.endLine = i - 1;
          blocks.push(currentBlock);
        }
        currentBlock = {
          type: 'code',
          startLine: i + 1, // Exclude opening ```
          endLine: i, // Will be updated
          title: trimmed.replace(/^```/, '').trim(), // Language
          level: 2,
          id: `code-${i}`
        };
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      if (currentBlock) {
        currentBlock.endLine = i;
      }
      continue;
    }

    // Section Detection (## )
    if (trimmed.startsWith('## ')) {
      if (currentBlock) {
        currentBlock.endLine = i - 1;
        blocks.push(currentBlock);
      }
      currentBlock = {
        type: 'section',
        startLine: i,
        endLine: i,
        title: trimmed.replace(/^##\s+/, ''),
        level: 1,
        id: `section-${i}`
      };
    }
    // Card Detection (### )
    else if (trimmed.startsWith('### ')) {
       if (currentBlock) {
         currentBlock.endLine = i - 1;
         blocks.push(currentBlock);
       }
       currentBlock = {
         type: 'card',
         startLine: i,
         endLine: i,
         title: trimmed.replace(/^###\s+/, ''),
         level: 2,
         id: `card-${i}`
       };
    }
    // Content extension
    else {
      if (currentBlock) {
        currentBlock.endLine = i;
      }
    }
  }

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}

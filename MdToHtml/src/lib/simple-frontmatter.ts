
export interface FrontmatterData {
  title?: string;
  date?: string;
  tags?: string[];
  brief?: string;
  type?: 'project' | 'paper';
  [key: string]: any;
}

export function parseFrontmatter(markdown: string): FrontmatterData {
  if (!markdown) return {};

  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatterBlock = match[1];
  const data: FrontmatterData = {};

  const lines = frontmatterBlock.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key === 'tags') {
      // Handle tags array [tag1, tag2]
      if (value.startsWith('[') && value.endsWith(']')) {
        data.tags = value.slice(1, -1).split(',').map(t => t.trim().replace(/^['"]|['"]$/g, ''));
      } else {
        // Handle multiline list not supported in simple parser, assume single line array
        data.tags = [];
      }
    } else {
      data[key] = value;
    }
  }

  return data;
}

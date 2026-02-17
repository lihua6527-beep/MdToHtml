
export interface ValidationResult {
  type: 'error' | 'warning';
  message: string;
  line: number;
  suggestion?: string; // Human readable suggestion
  fix?: {              // Actionable fix
    newText: string;
    range: 'line';     // Currently only support replacing the whole line
  };
}

export const validateContent = (content: string): ValidationResult[] => {
  const lines = content.split('\n');
  const results: ValidationResult[] = [];
  
  let currentSection: string | null = null;
  let inCodeBlock = false;
  let hasH1 = false;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) return;

    // Handle code blocks
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;

    // Rule 1: H1 Usage (Must be at top, only one)
    if (trimmed.startsWith('# ')) {
      if (hasH1) {
         results.push({
           type: 'warning',
           message: 'Multiple H1 (Titles) detected. CHD usually has one single document title.',
           line: lineNum,
           suggestion: 'Change to H2 (Section) if this is a new section.',
           fix: { newText: '#' + line, range: 'line' }
         });
      }
      hasH1 = true;
    }

    // Rule 2: Section Definition (H2)
    if (trimmed.startsWith('## ')) {
      currentSection = trimmed;
      // Check for attributes
      if (trimmed.includes('{') && !trimmed.includes('}')) {
         results.push({
           type: 'error',
           message: 'Unclosed attribute bracket',
           line: lineNum,
           suggestion: 'Add "}" to the end of the line.',
           fix: { newText: line + '}', range: 'line' }
         });
      }
    }

    // Rule 3: Card Definition (H3)
    if (trimmed.startsWith('### ')) {
      if (!currentSection) {
        results.push({
          type: 'error',
          message: 'Orphaned Card: Card (###) defined outside of any Section (##)',
          line: lineNum,
          suggestion: 'Create a Section (##) above this card.',
          fix: { newText: '## New Section\n' + line, range: 'line' }
        });
      }
      
      // Check for attributes
      if (trimmed.includes('{') && !trimmed.includes('}')) {
         results.push({
           type: 'error',
           message: 'Unclosed attribute bracket',
           line: lineNum,
           suggestion: 'Add "}" to the end of the line.',
           fix: { newText: line + '}', range: 'line' }
         });
      }
    }

    // Rule 4: Invalid Header Levels (H4+)
    if (trimmed.startsWith('####')) {
      results.push({
        type: 'error',
        message: 'Invalid Hierarchy: CHD only supports H1, H2, and H3.',
        line: lineNum,
        suggestion: 'Convert to Card (###) or Bold Text.',
        fix: { newText: line.replace(/^#+/, '###'), range: 'line' }
      });
    }

    // Rule 5: Attribute Syntax
    // Check for {style=stat} (missing quotes)
    const attrMatch = line.match(/\{([^}]+)\}/);
    if (attrMatch) {
        const content = attrMatch[1];
        // Check for unquoted values: key=value
        const unquotedMatch = content.match(/([a-zA-Z0-9_-]+)=([^"\s]+)/);
        if (unquotedMatch) {
            const key = unquotedMatch[1];
            const val = unquotedMatch[2];
            // If it's not a number (which might be valid in some parsers, but let's enforce quotes for consistency)
            // Actually, let's enforce quotes for everything in CHD
            results.push({
                type: 'warning',
                message: 'Attribute values should be quoted',
                line: lineNum,
                suggestion: `Change ${key}=${val} to ${key}="${val}"`,
                fix: { 
                    newText: line.replace(`${key}=${val}`, `${key}="${val}"`),
                    range: 'line'
                }
            });
        }

        // Check for shorthand like {stat} instead of {card-style="stat"}
        if (!content.includes('=') && !content.startsWith('.')) {
             // Common mistake mapping
             const map: Record<string, string> = {
                 'stat': 'card-style="stat"',
                 'highlight': 'card-style="highlight"',
                 'quote': 'card-style="quote"',
                 'warning': 'card-style="warning"'
             };
             
             if (map[content.trim()]) {
                 results.push({
                    type: 'warning',
                    message: `Deprecated shorthand "{${content}}"`,
                    line: lineNum,
                    suggestion: `Use standard syntax: {${map[content.trim()]}}`,
                    fix: {
                        newText: line.replace(`{${content}}`, `{${map[content.trim()]}}`),
                        range: 'line'
                    }
                 });
             }
        }
    }
  });

  return results;
};

export const parseAttributes = (text: string) => {
  if (!text) return { cleanText: '', props: {} };

  // Normalize Chinese braces to standard ones
  const normalizedText = text.replace(/｛/g, '{').replace(/｝/g, '}');
  
  // Find the last occurrence of {
  const openBraceIndex = normalizedText.lastIndexOf('{');
  
  // If no brace found, or it's at the start (unlikely for attributes), return as is
  // But strictly speaking, attributes should be at the end.
  // We'll require it to be reasonably close to the end or just the last block.
  
  if (openBraceIndex === -1) {
      return { cleanText: text.trim(), props: {} };
  }

  // Check if there is a closing brace after the opening brace
  const closeBraceIndex = normalizedText.indexOf('}', openBraceIndex);
  
  // Extract content
  // If no closing brace, we take everything until end (for typing support)
  // If there is a closing brace, we take until that brace
  const content = closeBraceIndex !== -1 
      ? normalizedText.substring(openBraceIndex + 1, closeBraceIndex)
      : normalizedText.substring(openBraceIndex + 1);
      
  // Verify if it looks like attributes (contains =)
  // If not, it might be just text with braces.
  if (!content.includes('=')) {
      // Not attributes, return original
      // Unless we want to force strip {} tags? 
      // For now, let's assume if it has =, it's attributes.
      // But wait, {layout="grid"} has =. {grid} does not.
      // Users might use shorthand? Current parser only supports key=value.
      // So checking for = is safe.
      return { cleanText: text.trim(), props: {} };
  }

  const props: Record<string, string> = {};
  
  // Regex to match key="value", key='value', or key=value
  // Handles spaces within quotes
  const attrRegex = /([a-zA-Z0-9_-]+)=(?:"([^"]*)"|'([^']*)'|([^,\s}]+))/g;
  
  let attrMatch;
  while ((attrMatch = attrRegex.exec(content)) !== null) {
      const key = attrMatch[1];
      // Value is in group 2 (double quotes), 3 (single quotes), or 4 (no quotes)
      const value = attrMatch[2] !== undefined ? attrMatch[2] : 
                    attrMatch[3] !== undefined ? attrMatch[3] : 
                    attrMatch[4];
      
      if (key && value !== undefined) {
          props[key] = value;
      }
  }
  
  // Remove the attribute block from the text
  // We remove from openBraceIndex to end (or closeBraceIndex + 1)
  // But we need to handle the original text, not normalized.
  // Since we only replaced braces, indices might align if lengths are same.
  // { is 1 char, ｛ is 1 char. So indices are safe.
  
  let cleanText = '';
  if (closeBraceIndex !== -1) {
      // Remove everything from openBraceIndex to closeBraceIndex + 1
      cleanText = text.substring(0, openBraceIndex) + text.substring(closeBraceIndex + 1);
  } else {
      // Remove everything from openBraceIndex to end
      cleanText = text.substring(0, openBraceIndex);
  }

  return { cleanText: cleanText.trim(), props };
};

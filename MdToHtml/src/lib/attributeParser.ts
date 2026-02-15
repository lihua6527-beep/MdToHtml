export const parseAttributes = (text: string) => {
  const regex = /\{([^}]+)\}/;
  const match = text.match(regex);
  const props: Record<string, string> = {};
  
  if (match) {
    const content = match[1];
    
    // Regex to match key="value", key='value', or key=value
    // Handles spaces within quotes
    // Explanation:
    // ([a-zA-Z0-9_-]+)  -> Key
    // =                 -> Separator
    // (?:               -> Non-capturing group for value variants
    //   "([^"]*)"       -> Double quoted value (Group 2)
    //   |               -> OR
    //   '([^']*)'       -> Single quoted value (Group 3)
    //   |               -> OR
    //   ([^,\s]+)       -> Unquoted value (Group 4) - stops at comma or space
    // )
    const attrRegex = /([a-zA-Z0-9_-]+)=(?:"([^"]*)"|'([^']*)'|([^,\s]+))/g;
    
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
  }
  
  const cleanText = text.replace(regex, '').trim();
  return { cleanText, props };
};


const parseAttributes = (text) => {
  // Enhanced regex to be more robust
  // 1. Allow optional whitespace at the end
  // 2. Allow attributes to be preceded by whitespace
  // 3. Capture content inside {}
  const regex = /\s*\{([^}]*)\}\s*$/;
  const match = text.match(regex);
  const props = {};
  
  if (match) {
    const content = match[1];
    
    // Same attribute regex as before, but ensure it handles spaces correctly
    const attrRegex = /([a-zA-Z0-9_-]+)=(?:\"([^\"]*)\"|'([^']*)'|([^,\s]+))/g;
    
    let attrMatch;
    while ((attrMatch = attrRegex.exec(content)) !== null) {
        const key = attrMatch[1];
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

const testCases = [
  { input: "Title {key=val}", expected: "Title" },
  { input: "Title {key=val}  ", expected: "Title" }, // Trailing spaces
  { input: "Title  {key=val}", expected: "Title" }, // Multiple spaces before {
  { input: "Title { key=val }", expected: "Title" }, // Spaces inside {}
  { input: "Title {key='val with spaces'}", expected: "Title" },
  { input: "Title", expected: "Title" },
  { input: "Title {invalid", expected: "Title {invalid" }, // Unclosed
  { input: "Title {key=val} suffix", expected: "Title {key=val} suffix" }, // Suffix prevents match (by design?)
];

testCases.forEach(({ input, expected }, index) => {
  const { cleanText, props } = parseAttributes(input);
  console.log(`Test ${index + 1}: Input: "${input}"`);
  console.log(`  Clean: "${cleanText}"`);
  console.log(`  Props:`, props);
  if (cleanText !== expected) {
    console.error(`  FAIL: Expected "${expected}", got "${cleanText}"`);
  } else {
    console.log(`  PASS`);
  }
});

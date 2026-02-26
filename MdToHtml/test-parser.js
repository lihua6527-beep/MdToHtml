
const parseAttributes = (text) => {
  const regex = /\{([^}]*)\}?$/;
  const match = text.match(regex);
  const props = {};
  
  if (match) {
    const content = match[1];
    const attrRegex = /([a-zA-Z0-9_-]+)=(?:"([^"]*)"|'([^']*)'|([^,\s]+))/g;
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
  "核心价值 {card-style=summary col-span=12 content-align=center title-size=text-2xl}",
  "核心痛点解决 {layout=grid columns=3}",
  "Title with trailing space {attr=val} ",
  "Title with unclosed brace {attr=val",
  "No attributes",
  "Title { key=val }", // Spaces inside
  "Title {key='val with spaces'}"
];

testCases.forEach(t => {
  console.log(`Input: '${t}'`);
  console.log(JSON.stringify(parseAttributes(t.trim()), null, 2));
});

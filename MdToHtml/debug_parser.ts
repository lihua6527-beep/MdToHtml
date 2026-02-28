
import { parseAttributes } from './src/lib/attributeParser';

const testCases = [
  "## My Title {align=center}",
  "## My Title {align='center'}",
  "## My Title {align=\"center\"}",
  "## My Title { align=center }",
  "## My Title {align=center} ",
  "## My Title {align=center}  ",
  "## My Title{align=center}",
  "## My Title {key1=val1, key2=val2}",
  "## My Title {key1=val1 key2=val2}",
  "## My Title { key1 = val1 }", // This one should fail key-value parsing but succeed block stripping
  "## My Title",
  "## {align=center} My Title", // Should NOT strip
];

console.log("Testing parseAttributes...");

testCases.forEach((input, index) => {
  console.log(`\nTest Case ${index + 1}: "${input}"`);
  const result = parseAttributes(input);
  console.log(`Clean Text: "${result.cleanText}"`);
  console.log(`Props:`, result.props);
  
  // Check if stripping worked (for cases where it should)
  if (input.includes('{') && !input.startsWith('## {') && result.cleanText.includes('{')) {
     console.error("FAIL: Attributes not stripped!");
  } else if (input.includes('{') && !input.startsWith('## {') && !result.cleanText.includes('{')) {
     console.log("PASS: Attributes stripped.");
  }
});

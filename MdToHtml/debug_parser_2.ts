
import { parseAttributes } from './src/lib/attributeParser';

const testCases = [
  "## My Title {align=c",
  "## My Title {align=center",
  "## My Title {",
];

console.log("Testing parseAttributes (Incomplete)...");

testCases.forEach((input, index) => {
  console.log(`\nTest Case ${index + 1}: "${input}"`);
  const result = parseAttributes(input);
  console.log(`Clean Text: "${result.cleanText}"`);
  console.log(`Props:`, result.props);
});

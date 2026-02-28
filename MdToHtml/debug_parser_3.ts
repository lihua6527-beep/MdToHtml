
import { parseAttributes } from './src/lib/attributeParser';

const testCases = [
  "## My Title ｛align=center｝", // Chinese braces
  "## My Title {align=center}",
];

console.log("Testing parseAttributes (Chinese Braces)...");

testCases.forEach((input, index) => {
  console.log(`\nTest Case ${index + 1}: "${input}"`);
  const result = parseAttributes(input);
  console.log(`Clean Text: "${result.cleanText}"`);
  console.log(`Props:`, result.props);
});

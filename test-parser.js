const { parseCHDBlocks } = require('./MdToHtml/src/lib/chdParser.ts');
const fs = require('fs');

// Read test file
const testContent = fs.readFileSync('./test-code-block.md', 'utf8');

// Parse the content
const blocks = parseCHDBlocks(testContent);

// Log the results
console.log('Parsed blocks:');
console.log(JSON.stringify(blocks, null, 2));

// Check if the card is parsed as a single block
const cardBlocks = blocks.filter(block => block.type === 'card');
console.log('\nCard blocks found:', cardBlocks.length);

if (cardBlocks.length === 1) {
  console.log('✓ SUCCESS: Card with code block is parsed as a single block');
  console.log('Card start line:', cardBlocks[0].startLine);
  console.log('Card end line:', cardBlocks[0].endLine);
  console.log('Card title:', cardBlocks[0].title);
} else {
  console.log('✗ FAILURE: Card with code block is not parsed as a single block');
}

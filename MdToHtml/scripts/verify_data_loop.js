
// Node 18+ has native fetch.
// const fetch = require('node-fetch');

async function verifyDataLoop() {
  console.log('Testing /api/save-session...');

  const payload = {
    slug: '测试会话_Demo',
    input: '# Initial Markdown\n\nContent here.',
    output: '# Modified Markdown\n\nContent here. {updated=true}',
    operations: [
      { type: 'updateAttribute', args: [0, 'updated', true], timestamp: Date.now() - 5000 },
      { type: 'moveCard', args: [0, 'down'], timestamp: Date.now() - 2000 }
    ]
  };

  try {
    const response = await fetch('http://localhost:3000/api/save-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', data);

    if (response.ok && data.success) {
      console.log('✅ API call successful.');
      console.log(`Generated Session Folder: ${data.path}`);
    } else {
      console.error('❌ API call failed.');
    }

  } catch (error) {
    console.error('❌ Error calling API:', error);
  }
}

verifyDataLoop();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT_DIR = path.join(__dirname, '../out');

try {
    console.log('Cleaning out directory...');
    if (fs.existsSync(OUT_DIR)) {
        fs.rmSync(OUT_DIR, { recursive: true, force: true });
        console.log('Out directory cleaned successfully');
    }
    
    console.log('Running Next.js build...');
    execSync('npm run build:next', { stdio: 'inherit' });
    
    console.log('Build completed successfully!');
    
} catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
}

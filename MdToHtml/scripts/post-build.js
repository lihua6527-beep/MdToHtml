const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '../out');
const DEST = path.join(__dirname, '../../output');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(function(childItemName) {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

try {
    console.log(`Moving output from ${SOURCE} to ${DEST}...`);
    
    // Clean DEST
    if (fs.existsSync(DEST)) {
        fs.rmSync(DEST, { recursive: true, force: true });
    }

    // Try rename (move) first - much faster than copy
    try {
        fs.renameSync(SOURCE, DEST);
    } catch (e) {
        console.log('Rename failed, falling back to copy...', e.message);
        // Ensure DEST parent exists
        if (!fs.existsSync(path.dirname(DEST))) {
             fs.mkdirSync(path.dirname(DEST), { recursive: true });
        }
        copyRecursiveSync(SOURCE, DEST);
    }
    
    console.log('Move/Copy completed.');
    
    // Execute organize_output logic if needed, or import it
    // For now, we assume organize_output.js exists and we can run it or it was part of the original chain
    // The original script was: next build && xcopy ... && node scripts/organize_output.js
    // So we should run organize_output.js here or call it from package.json
    
    // Check if organize_output.js exists
    const organizeScript = path.join(__dirname, 'organize_output.js');
    if (fs.existsSync(organizeScript)) {
        console.log('Running organize_output.js...');
        require('./organize_output.js');
    }
    
} catch (err) {
    console.error('Post-build script failed:', err);
    process.exit(1);
}

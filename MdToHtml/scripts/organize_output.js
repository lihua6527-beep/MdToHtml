const fs = require('fs');
const path = require('path');

// Define paths relative to the script location (MdToHtml/scripts/)
const rootDir = path.resolve(__dirname, '../../');
const inputDir = path.join(rootDir, 'input');
const outputDir = path.join(rootDir, 'output');
const resourcesDir = path.join(rootDir, 'MdToHtml/resources');

console.log('Organizing output...');
console.log(`Input: ${inputDir}`);
console.log(`Output: ${outputDir}`);
console.log(`Resources: ${resourcesDir}`);

if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
}

if (!fs.existsSync(inputDir)) {
    console.log('Input directory not found, skipping organization.');
    process.exit(0);
}

if (!fs.existsSync(outputDir)) {
    console.log('Output directory not found, skipping organization.');
    process.exit(0);
}

// Helper to patch HTML files with correct asset paths
function patchHtml(filePath, relativeAssetPath) {
    if (!fs.existsSync(filePath)) return;
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        // Replace /_next/ with relative path
        // Matches src="/_next/..." or href="/_next/..."
        // We use regex to be safe
        content = content.replace(/(src|href)="\/_next\//g, `$1="${relativeAssetPath}/_next/`);
        // Also handle other root-relative paths if necessary (e.g. /api/)
        // But mainly _next is critical for styles/scripts
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Patched ${path.basename(filePath)} with prefix ${relativeAssetPath}`);
    } catch (e) {
        console.error(`Failed to patch ${filePath}:`, e);
    }
}

// Get valid slugs from input
const inputFiles = fs.readdirSync(inputDir).filter(f => f.endsWith('.md'));
const validSlugs = new Set();

inputFiles.forEach(f => {
    const name = f.replace(/\.md$/, '');
    validSlugs.add(name); // Plain name only - we want 1:1 mapping with input files
});

console.log('Valid content slugs:', Array.from(validSlugs));

// Get all items in output
const outputItems = fs.readdirSync(outputDir);

outputItems.forEach(item => {
    // If it is a valid content slug, keep it in output but patch it
    if (validSlugs.has(item)) {
        // Item is a directory (e.g. output/slug)
        const itemPath = path.join(outputDir, item);
        if (fs.statSync(itemPath).isDirectory()) {
             // Look for index.html inside
             const htmlPath = path.join(itemPath, 'index.html');
             // Path from output/slug/index.html to resources
             // ../../MdToHtml/resources
             patchHtml(htmlPath, '../../MdToHtml/resources');
        }
        return;
    }

    // Otherwise, move it to resources
    const srcPath = path.join(outputDir, item);
    const destPath = path.join(resourcesDir, item);

    console.log(`Moving system file/folder: ${item} -> ${destPath}`);
    
    try {
        // If destination exists, remove it first to ensure clean move/copy
        if (fs.existsSync(destPath)) {
            fs.rmSync(destPath, { recursive: true, force: true });
        }
        
        // Try rename first (fastest)
        try {
            fs.renameSync(srcPath, destPath);
        } catch (renameErr) {
            // If rename fails (e.g. permission or cross-device), try copy+delete
            fs.cpSync(srcPath, destPath, { recursive: true });
            fs.rmSync(srcPath, { recursive: true, force: true });
        }

        // Patch HTML if it's an HTML file or directory containing HTML
        // Case 1: item is index.html or 404.html (file)
        if (item.endsWith('.html')) {
             // Path from resources/index.html to resources (same dir)
             // So ./
             patchHtml(destPath, '.');
        }
        // Case 2: item is a directory (e.g. encoded slug like %E4...)
        else if (fs.statSync(destPath).isDirectory()) {
             // Look for index.html inside
             const htmlPath = path.join(destPath, 'index.html');
             if (fs.existsSync(htmlPath)) {
                 // Path from resources/slug/index.html to resources
                 // ../
                 patchHtml(htmlPath, '..');
             }
        }

    } catch (e) {
        console.error(`Failed to move ${item}:`, e);
    }
});

console.log('Organization complete.');

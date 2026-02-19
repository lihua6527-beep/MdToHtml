const fs = require('fs');
const path = require('path');

// Define paths relative to the script location (MdToHtml/scripts/)
const rootDir = path.resolve(__dirname, '../../');
const inputDir = path.join(rootDir, 'input');
const outputDir = path.join(rootDir, 'output');
const resourcesDir = path.join(rootDir, 'MdToHtml/resources');
const portableDistDir = path.join(rootDir, 'portable_dist');

console.log('Starting Portable Export...');
console.log(`Source Output: ${outputDir}`);
console.log(`Source Resources: ${resourcesDir}`);
console.log(`Destination: ${portableDistDir}`);

// Ensure output directory exists (user must have built first)
if (!fs.existsSync(outputDir)) {
    console.error('[Error] Output directory not found. Please run "build_static.bat" first.');
    process.exit(1);
}

// Ensure resources exist
if (!fs.existsSync(resourcesDir)) {
    console.error('[Error] Resources directory not found. Please verify the build.');
    process.exit(1);
}

// Ensure dist directory exists
if (!fs.existsSync(portableDistDir)) {
    fs.mkdirSync(portableDistDir, { recursive: true });
}

// 1. Get list of generated pages (directories in output)
// Filter out non-directories
const pages = fs.readdirSync(outputDir).filter(file => {
    return fs.statSync(path.join(outputDir, file)).isDirectory();
});

if (pages.length === 0) {
    console.log('[Info] No pages found in output directory.');
    process.exit(0);
}

console.log(`Found ${pages.length} pages to process:`, pages);

// Helper function to copy directory recursively
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

pages.forEach(pageName => {
    const pageSourceDir = path.join(outputDir, pageName);
    const pageDistDir = path.join(portableDistDir, pageName);
    const htmlSource = path.join(pageSourceDir, 'index.html');
    const txtSource = path.join(pageSourceDir, 'index.txt');

    // Skip if index.html is missing
    if (!fs.existsSync(htmlSource)) {
        console.log(`Skipping ${pageName}: index.html not found.`);
        return;
    }

    console.log(`\nProcessing: ${pageName}...`);

    // Clean destination if exists
    if (fs.existsSync(pageDistDir)) {
        fs.rmSync(pageDistDir, { recursive: true, force: true });
    }
    fs.mkdirSync(pageDistDir, { recursive: true });

    // 1. Read and Patch HTML
    let htmlContent = fs.readFileSync(htmlSource, 'utf8');
    
    // Replace the relative resource path "../../MdToHtml/resources/" with "./"
    // This assumes the assets will be in the same directory as index.html
    const relativePathPattern = /\.\.\/\.\.\/MdToHtml\/resources\//g;
    
    // Check if we need to patch
    if (relativePathPattern.test(htmlContent)) {
        htmlContent = htmlContent.replace(relativePathPattern, './');
        console.log(`  - Patched resource paths in index.html`);
    } else {
        console.log(`  - [Info] No standard resource paths found to patch.`);
        // Fallback: Replace /_next/ with ./_next/ if not already relative
        // htmlContent = htmlContent.replace(/(src|href)="\/_next\//g, '$1="./_next/');
    }

    // Write patched HTML to dist
    fs.writeFileSync(path.join(pageDistDir, 'index.html'), htmlContent);
    console.log(`  - Copied index.html`);

    // 2. Copy index.txt (optional but recommended for hydration)
    if (fs.existsSync(txtSource)) {
        fs.copyFileSync(txtSource, path.join(pageDistDir, 'index.txt'));
        console.log(`  - Copied index.txt`);
    }

    // 3. Copy Assets (_next folder) into the page directory
    // This makes the page self-contained
    const nextSource = path.join(resourcesDir, '_next');
    const nextDist = path.join(pageDistDir, '_next');

    try {
        if (fs.existsSync(nextSource)) {
            copyDir(nextSource, nextDist);
            console.log(`  - Copied assets (_next)`);
        } else {
            console.warn(`  - [Warning] _next folder not found in resources! Page may lack styles.`);
        }
    } catch (e) {
        console.error(`  - [Error] Failed to copy assets: ${e.message}`);
    }

    // 4. Copy other resources if needed (e.g., images)
    // If the page uses images from input/image, they might be referenced via specific paths
    // For now, we assume _next covers the main app logic
    
    console.log(`  > Success! Portable version created at: portable_dist/${pageName}/`);
});

console.log('\n--------------------------------------------------');
console.log('Portable Export Complete!');
console.log(`You can find your standalone pages in the "portable_dist" folder.`);
console.log('Each folder contains everything needed to run that page on any web server.');
console.log('--------------------------------------------------');

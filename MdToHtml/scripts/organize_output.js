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

// Generate index.html in output directory
console.log('Generating index.html in output directory...');
const indexPath = path.join(outputDir, 'index.html');
const slugs = Array.from(validSlugs).sort();

const listItems = slugs.map(slug => {
    // Check if the directory exists in output
    if (fs.existsSync(path.join(outputDir, slug))) {
        return `<li><a href="${slug}/index.html">${slug}</a></li>`;
    }
    return '';
}).join('\n');

const indexContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>已生成的文档列表</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
        h1 { border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 0.5rem 0; padding: 0.5rem; border: 1px solid #eee; border-radius: 4px; transition: background 0.2s; }
        li:hover { background: #f9f9f9; }
        a { text-decoration: none; color: #0066cc; display: block; }
        a:hover { text-decoration: underline; }
        .footer { margin-top: 2rem; font-size: 0.8rem; color: #666; border-top: 1px solid #eee; padding-top: 1rem; }
    </style>
</head>
<body>
    <h1>已生成的文档列表</h1>
    <p>以下是 output 文件夹中生成的静态文档：</p>
    <ul>
        ${listItems}
    </ul>
    <div class="footer">
        <p>提示：若要重新生成，请运行根目录下的 <code>build_static.bat</code> 脚本。</p>
    </div>
</body>
</html>`;

try {
    fs.writeFileSync(indexPath, indexContent, 'utf8');
    console.log(`Generated ${indexPath}`);
} catch (e) {
    console.error('Failed to generate index.html:', e);
}

console.log('Organization complete.');

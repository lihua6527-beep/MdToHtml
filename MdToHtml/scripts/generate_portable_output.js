const fs = require('fs');
const path = require('path');

// Define paths
const rootDir = path.resolve(__dirname, '../../');
const outputDir = path.join(rootDir, 'output');

console.log('正在生成便携版静态网页:', outputDir);

if (!fs.existsSync(outputDir)) {
    console.error('未找到 output 文件夹。请先运行构建命令。');
    process.exit(1);
}

// Helper: Rename URL-encoded directories to Chinese
function renameEncodedDirectories(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Check if name is encoded (contains %)
            if (item.includes('%')) {
                try {
                    const decodedName = decodeURIComponent(item);
                    if (decodedName !== item) {
                        const newPath = path.join(dir, decodedName);
                        // If target already exists, remove it first (to avoid conflict or merge)
                        if (fs.existsSync(newPath)) {
                            fs.rmSync(newPath, { recursive: true, force: true });
                        }
                        fs.renameSync(fullPath, newPath);
                        console.log(`已重命名文件夹: ${item} -> ${decodedName}`);
                        // Update fullPath for recursion
                        renameEncodedDirectories(newPath);
                        return; // Continue to next item since this one is moved
                    }
                } catch (e) {
                    console.error(`重命名失败: ${item}`, e);
                }
            }
            // Recurse into subdirectories
            renameEncodedDirectories(fullPath);
        }
    });
}

// 1. Rename folders first
renameEncodedDirectories(outputDir);

// 2. Find and patch HTML files
function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            findHtmlFiles(filePath, fileList);
        } else {
            if (path.extname(file) === '.html') {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const htmlFiles = findHtmlFiles(outputDir);
console.log(`找到 ${htmlFiles.length} 个 HTML 文件需要处理。`);

htmlFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Calculate relative path to root
    const relativePathToRoot = path.relative(path.dirname(filePath), outputDir);
    const prefix = relativePathToRoot ? relativePathToRoot.replace(/\\/g, '/') : '.';
    
    // Patch /_next/ to relative path
    const regex = /(src|href)="\/_next\/([^"]*)"/g;
    let patched = false;
    
    if (regex.test(content)) {
        content = content.replace(regex, (match, attr, resourcePath) => {
            return `${attr}="${prefix}/_next/${resourcePath}"`;
        });
        patched = true;
    }
    
    if (patched) {
        fs.writeFileSync(filePath, content, 'utf8');
        // console.log(`已修复路径: ${path.relative(outputDir, filePath)}`);
    }
});

// 3. Create README
const readmeContent = `便携版静态网页输出
===========================

此文件夹包含生成的静态网页。
它是完全便携的，不依赖原始项目文件。

使用说明:
1. 您可以将此 'output' 文件夹（或其中的特定页面文件夹）复制到任何 Web 服务器。
2. 您可以直接双击 'index.html' 在浏览器中打开预览。
3. 请勿删除 '_next' 文件夹，因为它包含页面所需的样式和脚本。

生成时间: ${new Date().toLocaleString('zh-CN')}
`;

fs.writeFileSync(path.join(outputDir, 'README.txt'), readmeContent);

console.log('便携版输出生成完成！');

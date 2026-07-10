const express = require('express');
const fs = require('fs');
const path = require('path');
const PathManager = require('./path-manager');

// Create express app with minimal configuration
const app = express();

// Optimize middleware - only include necessary ones
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' })); // extended: false for faster parsing

// 注意：Electron 模式下静态文件由 Next.js dev/production server 提供，
// 不再依赖静态导出产物（out/ 目录）

// API Routes - optimized for performance

// GET /api/app-info
app.get('/api/app-info', (req, res) => {
  try {
    // Cache PathManager results for better performance
    const appInfo = {
      inputPath: PathManager.getInputPath(),
      outputPath: PathManager.getOutputPath(),
      dataPath: PathManager.getDataPath(),
      appRoot: PathManager.getAppRoot(),
      config: PathManager.getAppConfig()
    };
    res.json(appInfo);
  } catch (error) {
    console.error('Error getting app info:', error);
    res.status(500).json({ error: 'Failed to get app info' });
  }
});

// GET /api/files
app.get('/api/files', (req, res) => {
  try {
    const inputDir = PathManager.getInputPath();
    
    if (!fs.existsSync(inputDir)) {
      return res.json({ files: [] });
    }

    // Use readdir with withFileTypes for more efficient filtering
    fs.readdir(inputDir, { withFileTypes: true }, (err, dirents) => {
      if (err) {
        console.error('Error reading input directory:', err);
        return res.status(500).json({ error: 'Failed to list files' });
      }

      const mdFiles = dirents
        .filter(dirent => dirent.isFile() && (dirent.name.endsWith('.md') || dirent.name.endsWith('.markdown')))
        .map(dirent => dirent.name)
        .sort((a, b) => a.localeCompare(b))
        .map(file => ({
          name: file,
          path: path.join(inputDir, file),
          slug: file.replace(/\.(md|markdown)$/, '')
        }));

      res.json({ files: mdFiles });
    });
  } catch (error) {
    console.error('Error reading input directory:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// POST /api/load
app.post('/api/load', (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Filename is required' });

    const inputDir = PathManager.getInputPath();
    const filePath = path.join(inputDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Use readFile with highWaterMark for better performance with large files
    fs.readFile(filePath, { encoding: 'utf8', highWaterMark: 64 * 1024 }, (err, content) => {
      if (err) {
        console.error('Error loading file:', err);
        return res.status(500).json({ error: 'Failed to load file' });
      }
      res.json({ content });
    });
  } catch (error) {
    console.error('Error loading file:', error);
    res.status(500).json({ error: 'Failed to load file' });
  }
});

// POST /api/save
app.post('/api/save', (req, res) => {
  try {
    const { slug, content } = req.body;
    if (!slug || !content) return res.status(400).json({ error: 'Slug and content are required' });

    const inputDir = PathManager.getInputPath();
    
    // Create directory asynchronously for better performance
    if (!fs.existsSync(inputDir)) {
      fs.mkdirSync(inputDir, { recursive: true });
    }

    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5]/g, '-');
    const filename = `${safeSlug}.md`;
    const filePath = path.join(inputDir, filename);

    // Use writeFile for non-blocking operation
    fs.writeFile(filePath, content, 'utf8', (err) => {
      if (err) {
        console.error('Error saving file:', err);
        return res.status(500).json({ error: 'Failed to save file' });
      }
      res.json({ success: true, path: filePath });
    });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// POST /api/save-export
app.post('/api/save-export', (req, res) => {
  try {
    const { filename, content, metadata } = req.body;
    if (!filename || !content) {
        return res.status(400).json({ error: 'Filename and content are required' });
    }

    const outputDir = PathManager.getOutputPath();
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create category subdirectories
    const categories = ['documents', 'projects', 'articles', 'others'];
    categories.forEach(category => {
      const categoryDir = path.join(outputDir, category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
        console.log(`[Export] Created category directory: ${categoryDir}`);
      }
    });

    let safeFilename = filename.replace(/[\\/:\*\?"<>\|]/g, '_');
    if (!safeFilename.endsWith('.html')) {
      safeFilename += '.html';
    }

    // Determine category based on metadata type
    let category = 'others';
    if (metadata) {
      const type = metadata.type || metadata.category;
      if (type === 'document' || type === 'doc') {
        category = 'documents';
      } else if (type === 'project' || type === 'proj') {
        category = 'projects';
      } else if (type === 'article' || type === 'blog' || type === 'post') {
        category = 'articles';
      }
    }

    const categoryDir = path.join(outputDir, category);
    const filePath = path.join(categoryDir, safeFilename);
    
    // Use writeFile for non-blocking operation
    fs.writeFile(filePath, content, 'utf8', (err) => {
      if (err) {
        console.error('Error saving export file:', err);
        return res.status(500).json({ error: 'Failed to save file' });
      }
      console.log(`[Export] Saved file to: ${filePath}`);

      // Generate JSON metadata file if emitJson is enabled
      try {
        const appConfig = PathManager.getAppConfig();
        const emitJson = !!appConfig.exportOptions?.emitJson;
        if (emitJson) {
          const baseName = path.basename(safeFilename, '.html');
          
          let meta;
          if (metadata) {
              // Use provided metadata
              meta = {
                  id: baseName,
                  type: metadata.type || 'project',
                  title: metadata.title || baseName,
                  brief: metadata.brief || '',
                  date: metadata.date || new Date().toISOString().slice(0, 10),
                  tags: metadata.tags || [],
                  chdVersion: '2.4',
                  htmlFile: `${category}/${safeFilename}`,
                  ...metadata // Allow overrides
              };
          } else {
              // Fallback to extraction
              let title = baseName;
              const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/i);
              if (titleMatch && titleMatch[1]) {
              title = titleMatch[1].trim();
              }
              let bodyInner = content;
              const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
              if (bodyMatch && bodyMatch[1]) {
              bodyInner = bodyMatch[1];
              }
              let plain = bodyInner
              .replace(/<script[\s\S]*?<\/script>/gi, ' ')
              .replace(/<style[\s\S]*?<\/style>/gi, ' ')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/\s+/g, ' ')
              .trim();
              const brief = plain.slice(0, 100);
              meta = {
              id: baseName,
              type: 'project',
              title,
              brief,
              date: new Date().toISOString().slice(0, 10),
              tags: [] as string[],
              chdVersion: '2.4',
              htmlFile: `${category}/${safeFilename}`
              };
          }

          const jsonPath = path.join(categoryDir, `${baseName}.json`);
          fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 2), 'utf8');
          console.log(`[Export] Saved metadata to: ${jsonPath}`);
        }
      } catch (metaErr) {
        console.warn('[Export] Failed to emit JSON metadata:', metaErr);
      }

      res.json({ success: true, path: filePath });
    });
  } catch (error) {
    console.error('Error saving export file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// POST /api/clear-export
app.post('/api/clear-export', (req, res) => {
  try {
    const outputDir = PathManager.getOutputPath();
    if (!fs.existsSync(outputDir)) {
      return res.json({ count: 0 });
    }

    let count = 0;
    
    // Recursive function to delete files in directory and subdirectories
    function deleteExportFiles(dir) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          // Recursively process subdirectory
          deleteExportFiles(filePath);
        } else if (file.endsWith('.html') || file.endsWith('.json')) {
          // Delete HTML and JSON files
          fs.unlinkSync(filePath);
          count++;
          console.log(`[Clear Export] Deleted: ${filePath}`);
        }
      }
    }

    // Start deleting from output directory
    deleteExportFiles(outputDir);

    console.log(`[Clear Export] Total deleted: ${count} files`);
    res.json({ count });
  } catch (error) {
    console.error('Error clearing export files:', error);
    res.status(500).json({ error: 'Failed to clear export files' });
  }
});

// Electron 模式下不提供静态文件服务，
// 页面由 Next.js dev/production server 托管

// Optimized server startup with pre-loading
let getPortModule = null;

// Preload get-port module during initialization
async function preloadModules() {
  try {
    getPortModule = (await import('get-port')).default;
    console.log('[Express] Modules preloaded successfully');
  } catch (error) {
    console.warn('[Express] Failed to preload modules:', error);
  }
}

// Start preloading modules immediately
preloadModules();

// Optimized server startup
function startServer() {
  return new Promise(async (resolve, reject) => {
    try {
      // Use preloaded module or load if not available
      const getPort = getPortModule || (await import('get-port')).default;
      const port = await getPort({ port: 3000 });
      
      // Start server with optimized settings
      const server = app.listen(port, () => {
        console.log(`[Express] Server started on port ${port}`);
        resolve({ port, server });
      });
      
      // Optimize server settings
      server.setTimeout(30000); // 30 seconds timeout
      server.keepAliveTimeout = 60000; // 60 seconds keep-alive
    } catch (e) {
      console.error('[Express] Failed to start server:', e);
      reject(e);
    }
  });
}

module.exports = { startServer };
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const PathManager = require('./path-manager');

const app = express();
const upload = multer();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (Next.js export)
// In development, this might not exist yet, but in prod it will be in ../out
// When running via `next dev`, we don't use this server.
// This server is ONLY for the packaged Electron app.
const staticDir = path.join(__dirname, '../out');
console.log('[Express] Static directory:', staticDir);

if (!fs.existsSync(staticDir)) {
  console.error('[Express] Static directory does not exist!');
}

app.use(express.static(staticDir, { extensions: ['html'] }));

// API Routes
// These replicate the Next.js API routes logic

// GET /api/app-info
app.get('/api/app-info', (req, res) => {
  try {
    res.json({
      inputPath: PathManager.getInputPath(),
      outputPath: PathManager.getOutputPath(),
      dataPath: PathManager.getDataPath(),
      appRoot: PathManager.getAppRoot(),
      config: PathManager.getAppConfig()
    });
  } catch (error) {
    console.error('Error getting app info:', error);
    res.status(500).json({ error: 'Failed to get app info' });
  }
});

// GET /api/files
app.get('/api/files', (req, res) => {
  try {
    const inputDir = PathManager.getInputPath();
    console.log('[API/Files] Scanning input directory:', inputDir);
    
    if (!fs.existsSync(inputDir)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(inputDir)
      .filter(file => file.endsWith('.md') || file.endsWith('.markdown'))
      .sort((a, b) => a.localeCompare(b))
      .map(file => ({
        name: file,
        path: path.join(inputDir, file),
        slug: file.replace(/\.(md|markdown)$/, '')
      }));

    res.json({ files });
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

    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
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

    // Note: In Next.js API it was saving to dataDir for some reason (maybe temporary?), 
    // but typically we save back to inputDir if we are editing.
    // However, the Next.js API `save/route.ts` used `PathManager.getInputPath()` as `dataDir`.
    // Let's stick to that logic.
    const inputDir = PathManager.getInputPath();
    
    if (!fs.existsSync(inputDir)) {
      fs.mkdirSync(inputDir, { recursive: true });
    }

    // Ensure safe filename
    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5]/g, '-');
    const filename = `${safeSlug}.md`;
    const filePath = path.join(inputDir, filename);

    fs.writeFileSync(filePath, content, 'utf8');
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// POST /api/upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const originalName = file.originalname;
    if (!originalName.endsWith('.md') && !originalName.endsWith('.markdown')) {
      return res.status(400).json({ error: 'Only Markdown files are allowed' });
    }

    const content = file.buffer.toString('utf-8');
    
    // Parse status from frontmatter (simple regex)
    let status = 'pending';
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
        const fm = match[1];
        const statusMatch = fm.match(/status:\s*(.*)/);
        if (statusMatch) {
            status = statusMatch[1].trim();
        }
    }

    const postsDir = PathManager.getInputPath();
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    const filePath = path.join(postsDir, originalName);
    
    if (fs.existsSync(filePath)) {
        console.log(`[Upload] Overwriting existing file: ${originalName}`);
    }
    
    fs.writeFileSync(filePath, file.buffer);
    const stats = fs.statSync(filePath);

    res.json({
      success: true,
      post: {
        slug: originalName.replace(/\.(md|markdown)$/i, ''),
        mtime: stats.mtimeMs,
        status: status
      }
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Upload failed', details: String(error) });
  }
});

// POST /api/save-export
app.post('/api/save-export', (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!filename || !content) {
        return res.status(400).json({ error: 'Filename and content are required' });
    }

    const outputDir = PathManager.getOutputPath();
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let safeFilename = filename.replace(/[\\/:\*\?"<>|]/g, '_');
    if (!safeFilename.endsWith('.html')) {
      safeFilename += '.html';
    }

    const filePath = path.join(outputDir, safeFilename);
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`[Export] Saved file to: ${filePath}`);
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving export file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// POST /api/dataset
app.post('/api/dataset', (req, res) => {
  try {
    const { input, output, previous_content, current_content, metadata } = req.body;

    if (!input || !output) {
      return res.status(400).json({ error: 'Input and output are required' });
    }

    const dataDir = PathManager.getDataPath();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, 'training_dataset.jsonl');
    
    // 1. Log Edit Task
    if (previous_content !== undefined && current_content !== undefined && previous_content !== current_content) {
        const editEntry = {
            task_type: 'edit',
            input: previous_content,
            output: current_content,
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString(),
                char_diff: current_content.length - previous_content.length,
                status: 'completed',
                reviewed: true
            }
        };
        fs.appendFileSync(filePath, JSON.stringify(editEntry) + '\n', 'utf8');
    }

    // 2. Log Parse Task
    const parseEntry = {
      task_type: 'parse',
      input,
      output,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        status: 'completed',
        reviewed: true
      }
    };

    fs.appendFileSync(filePath, JSON.stringify(parseEntry) + '\n', 'utf8');
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging dataset:', error);
    res.status(500).json({ error: 'Failed to log dataset' });
  }
});

// POST /api/save-session
app.post('/api/save-session', (req, res) => {
  try {
    const { slug, input, output, operations, score } = req.body;

    if (!slug || !input || !output) {
      return res.status(400).json({ error: 'Missing required fields: slug, input, output' });
    }

    const dataRoot = PathManager.getDataPath();
    if (!fs.existsSync(dataRoot)) {
      fs.mkdirSync(dataRoot, { recursive: true });
    }

    const safeSlug = slug.replace(/[\\/:*?"<>|]/g, '_');
    const sessionDir = path.join(dataRoot, safeSlug);

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();

    // 1. Initial File (initial.md)
    // Only write if it doesn't exist.
    const initialPath = path.join(sessionDir, 'initial.md');
    if (!fs.existsSync(initialPath)) {
        // Try to find original file in input directory to use as true initial
        const inputDir = PathManager.getInputPath();
        const originalPath = path.join(inputDir, safeSlug.endsWith('.md') ? safeSlug : `${safeSlug}.md`);
        
        let initialContent = input; // Fallback to current input
        if (fs.existsSync(originalPath)) {
             try {
                 initialContent = fs.readFileSync(originalPath, 'utf8');
             } catch (e) {
                 console.error('Failed to read original file:', e);
             }
        }
        fs.writeFileSync(initialPath, initialContent, 'utf8');
    }

    // 2. Modification Record (history.jsonl)
    // Append the current state as a new line
    const historyPath = path.join(sessionDir, 'history.jsonl');
    
    // Check if we already have this content to avoid redundancy
    // User Requirement: "Don't copy all info if I just changed layout"
    // Strategy: If content is identical to last entry, skip saving content.
    // If operations are present, save operations.
    
    let shouldSaveContent = true;
    let lastContent = null;
    
    if (fs.existsSync(historyPath)) {
        try {
            const fileContent = fs.readFileSync(historyPath, 'utf8');
            const lines = fileContent.trim().split('\n');
            if (lines.length > 0) {
                const lastLine = lines[lines.length - 1];
                const lastEntry = JSON.parse(lastLine);
                if (lastEntry.content) {
                    lastContent = lastEntry.content;
                    if (lastEntry.content === input) {
                        shouldSaveContent = false;
                    }
                }
            }
        } catch (e) {
            // If error, assume we need to save
        }
    } else {
        // Check initial.md if history is empty
        const initialPath = path.join(sessionDir, 'initial.md');
        if (fs.existsSync(initialPath)) {
             try {
                 const initialContent = fs.readFileSync(initialPath, 'utf8');
                 if (initialContent === input) {
                     shouldSaveContent = false;
                 }
             } catch(e) {}
        }
    }

    // Construct the record
    const record = {
        timestamp,
        score: score || null,
        operations: operations || []
    };

    if (shouldSaveContent) {
        record.content = input;
        record.type = 'content_edit';
    } else {
        // If content is same, it's likely a layout operation or just a save trigger
        if (operations && operations.length > 0) {
             record.type = 'layout_operation';
             // No content field needed, reduces redundancy
        } else {
             // If no operations and no content change, why are we saving?
             // Maybe metadata update?
             // Let's skip saving if truly nothing changed
             if (!score) {
                 // Skip saving entirely to avoid spam
                 return res.json({ success: true, path: safeSlug, status: 'skipped_no_change' });
             }
             record.type = 'metadata_update';
        }
    }

    fs.appendFileSync(historyPath, JSON.stringify(record) + '\n', 'utf8');
    
    res.json({ success: true, path: safeSlug });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// POST /api/history (Undo/Redo State Persistence)
app.post('/api/history', (req, res) => {
  try {
    const { sessionId, history } = req.body;
    if (!sessionId || !history) {
      return res.status(400).json({ error: 'SessionId and history are required' });
    }

    // Use a temp directory for history to avoid cluttering the user's workspace
    // But for simplicity in this file-based system, let's use a hidden .history folder in the input dir
    // or the system temp dir. User asked for "temporary JSON file".
    // Let's use os.tmpdir() + /MdToHtml/history
    const os = require('os');
    const tempDir = path.join(os.tmpdir(), 'MdToHtml', 'history');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = path.join(tempDir, `${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(history), 'utf8');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// GET /api/history
app.get('/api/history', (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ error: 'SessionId is required' });
    }

    const os = require('os');
    const tempDir = path.join(os.tmpdir(), 'MdToHtml', 'history');
    const filePath = path.join(tempDir, `${sessionId}.json`);

    if (fs.existsSync(filePath)) {
      const history = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      res.json({ history });
    } else {
      res.json({ history: null });
    }
  } catch (error) {
    console.error('Error loading history:', error);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// Fallback to index.html for SPA routing (if using dynamic routes, but static export usually has .html files)
// Since we use static export, dynamic routes like [slug] become [slug].html if generated, 
// OR we might need to rely on client-side routing if we export index.html and handle it there.
// But Next.js static export generates folders for routes usually.
// For now, let's just serve static files. If 404, maybe serve 404.html.

app.use((req, res, next) => {
    // If not found, and it's a navigation request, try serving index.html (for SPA)
    // But Next.js export is file-based.
    // If we request /editor, it should look for /editor.html
    if (req.method === 'GET' && req.accepts('html')) {
        // Try to see if there is an html file for the path
        const htmlPath = path.join(staticDir, req.path + '.html');
        if (fs.existsSync(htmlPath)) {
            return res.sendFile(htmlPath);
        }
        // Try index.html in the folder
        const indexHtmlPath = path.join(staticDir, req.path, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
            return res.sendFile(indexHtmlPath);
        }
    }
    next();
});

function startServer() {
  return new Promise(async (resolve, reject) => {
    try {
      // Dynamic import for ESM module support (get-port v7+ is ESM only)
      const getPort = (await import('get-port')).default;
      const port = await getPort({ port: 3000 });
      app.listen(port, () => {
        console.log(`[Express] Listening on port ${port}`);
        resolve(port);
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { startServer };

const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');

class PathManager {
  constructor() {
    this.appRoot = this.detectAppRoot();
    this.config = this.loadConfig();
    this.resolvePaths();
  }

  detectAppRoot() {
    // Check if running in Electron (Production/Packaged)
    if (app && app.isPackaged) {
      // In packaged Electron app, process.execPath is the executable file.
      // We want the directory where the executable resides.
      return path.dirname(process.execPath);
    }
    
    // In Development
    // Assume we are running from project root or electron folder
    // If run from project root: process.cwd() is project root
    return process.cwd();
  }

  loadConfig() {
    try {
      const configPath = path.join(this.appRoot, 'config.json');
      if (fs.existsSync(configPath)) {
        console.log('[PathManager] Loaded config from:', configPath);
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (e) {
      console.warn('[PathManager] Failed to load config:', e);
    }
    return {};
  }

  resolvePaths() {
    // Determine defaults first (Portable vs Fallback)
    const defaultInput = path.join(this.appRoot, 'input');
    const defaultOutput = path.join(this.appRoot, 'output');
    const defaultData = path.join(this.appRoot, 'data');
    
    let isWritable = false;
    try {
      // Check if we can write to appRoot
      // If appRoot doesn't exist (weird), it throws
      fs.accessSync(this.appRoot, fs.constants.W_OK);
      isWritable = true;
    } catch (e) {
      isWritable = false;
    }

    let baseInput = defaultInput;
    let baseOutput = defaultOutput;
    let baseData = defaultData;

    // If app root is not writable (e.g. installed in Program Files), fallback to Documents
    if (!isWritable) {
        const docDir = path.join(os.homedir(), 'Documents', 'MdToHtml');
        baseInput = path.join(docDir, 'input');
        baseOutput = path.join(docDir, 'output');
        baseData = path.join(docDir, 'data');
        console.warn(`[PathManager] App root is not writable. Fallback to Documents: ${docDir}`);
    }

    // Config overrides
    // Handle input path
    if (this.config.inputPath) {
        this.inputDir = path.isAbsolute(this.config.inputPath) 
            ? this.config.inputPath 
            : path.join(this.appRoot, this.config.inputPath);
    } else {
        this.inputDir = baseInput;
    }
        
    // Handle output path
    if (this.config.outputPath) {
        this.outputDir = path.isAbsolute(this.config.outputPath) 
            ? this.config.outputPath 
            : path.join(this.appRoot, this.config.outputPath);
    } else {
        this.outputDir = baseOutput;
    }
        
    // Data dir
    this.dataDir = baseData;

    // Ensure directories exist
    this.ensureDirectory(this.inputDir);
    this.ensureDirectory(this.outputDir);
    this.ensureDirectory(this.dataDir);

    console.log('[PathManager] Initialized paths:', {
        appRoot: this.appRoot,
        input: this.inputDir,
        output: this.outputDir,
        data: this.dataDir,
        isWritable
    });
  }

  ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (error) {
        console.error(`[PathManager] Failed to create directory: ${dirPath}`, error);
      }
    }
  }

  getInputPath() { return this.inputDir; }
  getOutputPath() { return this.outputDir; }
  getDataPath() { return this.dataDir; }
  getAppConfig() { return this.config; }
  getAppRoot() { return this.appRoot; }
}

// Singleton
module.exports = new PathManager();

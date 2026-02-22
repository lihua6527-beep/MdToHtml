import path from 'path';
import fs from 'fs';
import os from 'os';
import { loadConfig, AppConfig } from './config-loader';

class PathManager {
  private static instance: PathManager;
  private appRoot: string;
  private config: AppConfig;
  private inputDir: string = '';
  private outputDir: string = '';
  private dataDir: string = '';

  private constructor() {
    this.appRoot = this.detectAppRoot();
    this.config = loadConfig(this.appRoot);
    this.resolvePaths();
  }

  public static getInstance(): PathManager {
    if (!PathManager.instance) {
      PathManager.instance = new PathManager();
    }
    return PathManager.instance;
  }

  private detectAppRoot(): string {
    // Check if running in Electron (Production)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
        // In packaged Electron app, process.execPath is the executable file.
        // We want the directory where the executable resides.
        return path.dirname(process.execPath);
    }
    
    // In Development (Node.js/Next.js)
    // process.cwd() usually points to the project root (where package.json is).
    return process.cwd();
  }

  private resolvePaths() {
    // Determine defaults first (Portable vs Fallback)
    const defaultInput = path.join(this.appRoot, 'input');
    const defaultOutput = path.join(this.appRoot, 'output');
    const defaultData = path.join(this.appRoot, 'data');
    
    let isWritable = false;
    try {
      fs.accessSync(this.appRoot, fs.constants.W_OK);
      isWritable = true;
    } catch (e) {
      isWritable = false;
    }

    let baseInput = defaultInput;
    let baseOutput = defaultOutput;
    let baseData = defaultData;

    if (!isWritable) {
        const docDir = path.join(os.homedir(), 'Documents', 'MdToHtml');
        baseInput = path.join(docDir, 'input');
        baseOutput = path.join(docDir, 'output');
        baseData = path.join(docDir, 'data');
        console.warn(`App root is not writable. Fallback to Documents: ${docDir}`);
    }

    // Level 1: Config overrides
    this.inputDir = this.config.inputPath 
        ? (path.isAbsolute(this.config.inputPath) ? this.config.inputPath : path.join(this.appRoot, this.config.inputPath))
        : baseInput;
        
    this.outputDir = this.config.outputPath
        ? (path.isAbsolute(this.config.outputPath) ? this.config.outputPath : path.join(this.appRoot, this.config.outputPath))
        : baseOutput;
        
    // Data dir is always baseData unless we add config support later
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

  private ensureDirectory(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      try {
        fs.mkdirSync(dirPath, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory: ${dirPath}`, error);
      }
    }
  }

  public getInputPath(): string {
    return this.inputDir;
  }

  public getOutputPath(): string {
    return this.outputDir;
  }
  
  public getDataPath(): string {
    return this.dataDir;
  }
  
  public getAppConfig(): AppConfig {
    return this.config;
  }
  
  public getAppRoot(): string {
    return this.appRoot;
  }
}

export default PathManager.getInstance();

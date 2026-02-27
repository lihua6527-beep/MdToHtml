import path from 'path';
import fs from 'fs';
import os from 'os';
import ConfigManager from './config-manager';

class PathManager {
  private static instance: PathManager;
  private appRoot: string;
  private inputDir: string = '';
  private outputDir: string = '';
  private dataDir: string = '';
  private recycleDir: string = '';

  private constructor() {
    this.appRoot = this.detectAppRoot();
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
    const config = ConfigManager.getInstance().getConfig();
    const paths = config.paths || {};

    // Determine defaults first (Portable vs Fallback)
    const defaultInput = path.join(this.appRoot, 'input');
    const defaultOutput = path.join(this.appRoot, 'output');
    const defaultData = path.join(this.appRoot, 'data');
    const defaultRecycle = path.join(this.appRoot, '.trash');
    
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
    let baseRecycle = defaultRecycle;

    if (!isWritable) {
        const docDir = path.join(os.homedir(), 'Documents', 'MdToHtml');
        baseInput = path.join(docDir, 'input');
        baseOutput = path.join(docDir, 'output');
        baseData = path.join(docDir, 'data');
        baseRecycle = path.join(docDir, '.trash');
        console.warn(`App root is not writable. Fallback to Documents: ${docDir}`);
    }

    // Level 1: Config overrides
    this.inputDir = paths.input 
        ? (path.isAbsolute(paths.input) ? paths.input : path.join(this.appRoot, paths.input))
        : baseInput;
        
    this.outputDir = paths.output
        ? (path.isAbsolute(paths.output) ? paths.output : path.join(this.appRoot, paths.output))
        : baseOutput;
        
    this.dataDir = paths.data
        ? (path.isAbsolute(paths.data) ? paths.data : path.join(this.appRoot, paths.data))
        : baseData;

    this.recycleDir = paths.trash
        ? (path.isAbsolute(paths.trash) ? paths.trash : path.join(this.appRoot, paths.trash))
        : baseRecycle;

    // Ensure directories exist
    this.ensureDirectory(this.inputDir);
    this.ensureDirectory(this.outputDir);
    this.ensureDirectory(this.dataDir);
    this.ensureDirectory(this.recycleDir);

    console.log('[PathManager] Initialized paths:', {
        appRoot: this.appRoot,
        input: this.inputDir,
        output: this.outputDir,
        data: this.dataDir,
        recycle: this.recycleDir,
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
  
  public getRecyclePath(): string {
    return this.recycleDir;
  }

  // Legacy static accessors for compatibility
  public static getInputPath(): string {
    return PathManager.getInstance().getInputPath();
  }

  public static getOutputPath(): string {
    return PathManager.getInstance().getOutputPath();
  }
  
  public static getDataPath(): string {
    return PathManager.getInstance().getDataPath();
  }
  
  public static getRecyclePath(): string {
    return PathManager.getInstance().getRecyclePath();
  }
  
  public getAppRoot(): string {
    return this.appRoot;
  }

  public getAppConfig() {
    return ConfigManager.getInstance().getConfig();
  }

  public updateConfig(newConfig: any): void {
    ConfigManager.getInstance().updateConfig(newConfig);
    this.resolvePaths();
  }
}

export default PathManager.getInstance();

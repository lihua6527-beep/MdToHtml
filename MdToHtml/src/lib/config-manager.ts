import fs from 'fs';
import path from 'path';

export interface PathConfig {
  input: string;
  output: string;
  data: string;
  trash: string;
  chdProtocol?: string;
}

export interface SystemConfig {
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export interface AppConfig {
  paths?: Partial<PathConfig>;
  system?: Partial<SystemConfig>;
  capacityLimit?: number;
  exportOptions?: {
    emitJson?: boolean;
  };
  renderOptions?: {
    showDivider?: boolean;
    titleSpacing?: string;
  };
  // Legacy support
  inputPath?: string;
  outputPath?: string;
  recyclePath?: string;
}

class ConfigManager {
  private static instance: ConfigManager;
  private configPath: string;
  private config: AppConfig;

  private constructor() {
    // Detect root same way as PathManager or just use process.cwd() for now as it works in Next.js
    // For Electron, we might need adjustments, but let's stick to process.cwd() or similar logic
    this.configPath = path.join(process.cwd(), 'config.json');
    this.config = this.loadConfig();
    this.migrateLegacyConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        if (!content || content.trim() === '') {
          console.warn('Empty config file, using default config');
          return this.getDefaultConfig();
        }
        const cfg = JSON.parse(content);
        return this.validateConfig(cfg);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      // Try to backup corrupted config
      this.backupCorruptedConfig();
    }
    return this.getDefaultConfig();
  }

  private getDefaultConfig(): AppConfig {
    return {
      exportOptions: {
        emitJson: false
      },
      renderOptions: {
        showDivider: true,
        titleSpacing: '2'
      }
    };
  }

  private validateConfig(config: any): AppConfig {
    const validated: AppConfig = {
      exportOptions: { emitJson: false },
      renderOptions: { showDivider: true, titleSpacing: '2' }
    };

    // Validate paths
    if (config.paths && typeof config.paths === 'object') {
      validated.paths = {};
      Object.entries(config.paths).forEach(([key, value]) => {
        if (typeof value === 'string') {
          validated.paths![key as keyof PathConfig] = value;
        }
      });
    }

    // Validate export options
    if (config.exportOptions && typeof config.exportOptions === 'object') {
      validated.exportOptions = {
        emitJson: typeof config.exportOptions.emitJson === 'boolean' ? config.exportOptions.emitJson : false
      };
    }

    // Validate render options
    if (config.renderOptions && typeof config.renderOptions === 'object') {
      validated.renderOptions = {
        showDivider: typeof config.renderOptions.showDivider === 'boolean' ? config.renderOptions.showDivider : true,
        titleSpacing: typeof config.renderOptions.titleSpacing === 'string' ? config.renderOptions.titleSpacing : '2'
      };
    }

    // Validate capacity limit
    if (typeof config.capacityLimit === 'number' && config.capacityLimit > 0) {
      validated.capacityLimit = config.capacityLimit;
    }

    return validated;
  }

  private backupCorruptedConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const backupPath = this.configPath + '.backup';
        fs.copyFileSync(this.configPath, backupPath);
        console.log(`Corrupted config backed up to: ${backupPath}`);
      }
    } catch (error) {
      console.error('Failed to backup corrupted config:', error);
    }
  }

  private migrateLegacyConfig() {
    let changed = false;
    if (this.config.inputPath && !this.config.paths?.input) {
      if (!this.config.paths) this.config.paths = {};
      this.config.paths.input = this.config.inputPath;
      delete this.config.inputPath;
      changed = true;
    }
    if (this.config.outputPath && !this.config.paths?.output) {
      if (!this.config.paths) this.config.paths = {};
      this.config.paths.output = this.config.outputPath;
      delete this.config.outputPath;
      changed = true;
    }
    if (this.config.recyclePath && !this.config.paths?.trash) {
        if (!this.config.paths) this.config.paths = {};
        this.config.paths.trash = this.config.recyclePath;
        delete this.config.recyclePath;
        changed = true;
    }

    if (changed) {
      this.saveConfig();
    }
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public getPath(key: keyof PathConfig): string | undefined {
    return this.config.paths?.[key];
  }

  public setPath(key: keyof PathConfig, value: string) {
      if (!this.config.paths) this.config.paths = {};
      this.config.paths[key] = value;
      this.saveConfig();
  }

  public updateConfig(newConfig: Partial<AppConfig>) {
    this.config = {
      ...this.config,
      ...newConfig,
      paths: { ...this.config.paths, ...newConfig.paths },
      system: { ...this.config.system, ...newConfig.system },
      exportOptions: { ...this.config.exportOptions, ...newConfig.exportOptions },
      renderOptions: { ...this.config.renderOptions, ...newConfig.renderOptions },
    };
    this.saveConfig();
  }

  private saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }
}

export default ConfigManager;

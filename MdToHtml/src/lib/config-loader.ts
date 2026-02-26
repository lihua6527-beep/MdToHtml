import fs from 'fs';
import path from 'path';

export interface AppConfig {
  inputPath?: string;
  outputPath?: string;
  recyclePath?: string;
  autoSave?: boolean;
  theme?: string;
  capacityLimit?: number;
}

export function loadConfig(appRoot: string): AppConfig {
  const configPath = path.join(appRoot, 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.warn('Failed to load config.json:', error);
  }
  return {};
}

export function saveConfig(appRoot: string, config: AppConfig): boolean {
  const configPath = path.join(appRoot, 'config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to save config.json:', error);
    return false;
  }
}

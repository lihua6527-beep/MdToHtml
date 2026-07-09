/**
 * TempFileManager（服务端版本）— 临时文件管理器
 * 
 * 职责：
 * - 管理服务端临时 Markdown 文件（存储于 <project>/temp/ 目录）
 * - 自动命名规则：{slug}_temp_{timestamp}.md
 * - 提供保存、加载、确认保存（转正）功能
 * - 与客户端 TempFileManager（services/ai/TempFileManager.ts）形成互补
 */

import fs from 'fs';
import path from 'path';
import PathManager from './path-manager';
import MetadataCacheManager from './cache-manager';

const TEMP_DIR = 'temp';

export interface TempFileEntry {
  id: string;
  slug: string;
  fileName: string;
  content: string;
  createdAt: number;
  sourceFileName?: string;
}

export class ServerTempFileManager {
  private static getTempDir(): string {
    const baseDir = PathManager.getInputPath();
    const tempDir = path.join(baseDir, '..', TEMP_DIR);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
  }

  /**
   * 保存内容到临时目录
   */
  static saveTemp(slug: string, content: string): TempFileEntry {
    const tempDir = this.getTempDir();
    const timestamp = Date.now();
    const safeSlug = slug.replace(/[^a-zA-Z0-9\-\u4e00-\u9fa5\s_.\(\)]/g, '');
    const fileName = `${safeSlug}_temp_${timestamp}.md`;
    const filePath = path.join(tempDir, fileName);
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    const entry: TempFileEntry = {
      id: `temp-${timestamp}`,
      slug: safeSlug,
      fileName,
      content,
      createdAt: timestamp,
      sourceFileName: slug
    };
    
    return entry;
  }

  /**
   * 根据 ID 加载临时文件内容
   */
  static loadTemp(id: string): TempFileEntry | null {
    const tempDir = this.getTempDir();
    if (!fs.existsSync(tempDir)) return null;
    
    const files = fs.readdirSync(tempDir);
    const match = files.find(f => f.includes(id) || f.startsWith(id));
    
    if (!match) return null;
    
    const filePath = path.join(tempDir, match);
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    return {
      id: match.replace('_temp_', '_').replace('.md', ''),
      slug: match.replace(/_temp_\d+\.md$/, ''),
      fileName: match,
      content,
      createdAt: stats.birthtimeMs || stats.mtimeMs,
    };
  }

  /**
   * 根据文件名加载临时文件内容
   */
  static loadTempByFileName(fileName: string): TempFileEntry | null {
    const tempDir = this.getTempDir();
    if (!fs.existsSync(tempDir)) return null;
    
    const filePath = path.join(tempDir, fileName);
    if (!fs.existsSync(filePath)) return null;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const stats = fs.statSync(filePath);
    
    return {
      id: fileName.replace(/_temp_\d+\.md$/, ''),
      slug: fileName.replace(/_temp_\d+\.md$/, ''),
      fileName,
      content,
      createdAt: stats.birthtimeMs || stats.mtimeMs,
    };
  }

  /**
   * 获取所有临时文件列表
   */
  static listTempFiles(): { fileName: string; createdAt: number }[] {
    const tempDir = this.getTempDir();
    if (!fs.existsSync(tempDir)) return [];
    
    const files = fs.readdirSync(tempDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('.'))
      .map(f => {
        const filePath = path.join(tempDir, f);
        const stats = fs.statSync(filePath);
        return {
          fileName: f,
          createdAt: stats.birthtimeMs || stats.mtimeMs
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // 最新的在前
    
    return files;
  }

  /**
   * 确认保存：将临时文件转为正式文件（写入 input/ 目录）
   * 成功后删除临时文件
   * @param id 临时文件标识（用于匹配文件名）
   * @param customSlug 可选的自定义 slug，如果提供则用此名称保存
   */
  static confirmSave(id: string, customSlug?: string): { success: boolean; slug: string; error?: string } {
    const tempDir = this.getTempDir();
    if (!fs.existsSync(tempDir)) {
      return { success: false, slug: '', error: '临时目录不存在' };
    }
    
    const files = fs.readdirSync(tempDir);
    const match = files.find(f => f.includes(id));
    
    if (!match) {
      return { success: false, slug: '', error: '临时文件不存在' };
    }
    
    const tempFilePath = path.join(tempDir, match);
    const content = fs.readFileSync(tempFilePath, 'utf8');
    
    // 提取 slug（去掉 _temp_xxx 部分）
    const originalSlug = match.replace(/_temp_\d+\.md$/, '');
    const slug = customSlug || originalSlug;
    
    try {
      // 使用 CacheManager.update 写入 input/ 目录
      const cacheManager = MetadataCacheManager;
      cacheManager.update(slug, content);
      
      // 删除临时文件
      fs.unlinkSync(tempFilePath);
      
      return { success: true, slug };
    } catch (error: any) {
      return { success: false, slug, error: error.message || '保存失败' };
    }
  }

  /**
   * 清理所有临时文件
   */
  static clearAll(): number {
    const tempDir = this.getTempDir();
    if (!fs.existsSync(tempDir)) return 0;
    
    const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.md'));
    let count = 0;
    
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(tempDir, file));
        count++;
      } catch (e) {
        console.warn(`[ServerTempFileManager] 删除临时文件失败: ${file}`, e);
      }
    }
    
    return count;
  }
}

export default ServerTempFileManager;
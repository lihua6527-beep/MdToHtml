/**
 * TempFileManager — 临时文件管理器
 * 
 * 职责：
 * - 管理 AI 生成的临时 Markdown 文件（使用 sessionStorage）
 * - 自动命名规则：{源文件名}_标准化[_序号].md
 * - 页面关闭即丢弃（sessionStorage），刷新保留
 * - 确认保存时委托 FileService 写入 posts/ 目录（阶段二模拟，阶段三对接真实FileService）
 */

const STORAGE_KEY = 'ai_temp_files';

export interface TempFileItem {
  id: string;
  fileName: string;
  content: string;
  contentSize: number;        // 内容字节数
  createdAt: number;
  sourceFileName: string;
  version: number;
  usedPrompt: 'default' | 'alternative';
  usedModel: 'deepseek-chat' | 'deepseek-reasoner';
}

export class TempFileManager {
  /**
   * 创建新的临时文件
   */
  static createTemp(
    sourceFileName: string,
    content: string,
    usedPrompt: 'default' | 'alternative',
    usedModel: 'deepseek-chat' | 'deepseek-reasoner'
  ): TempFileItem {
    const items = this.loadFromStorage();
    const version = this.getNextVersion(sourceFileName);
    const newItem: TempFileItem = {
      id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: this.generateFileName(sourceFileName, version),
      content,
      contentSize: new Blob([content]).size,
      createdAt: Date.now(),
      sourceFileName,
      version,
      usedPrompt,
      usedModel,
    };
    items.push(newItem);
    this.saveToStorage(items);
    return newItem;
  }

  /** 获取所有临时文件（按创建时间排序） */
  static listTemps(): TempFileItem[] {
    return this.loadFromStorage();
  }

  /** 获取指定临时文件 */
  static getTemp(id: string): TempFileItem | undefined {
    return this.loadFromStorage().find(f => f.id === id);
  }

  /** 删除指定临时文件 */
  static deleteTemp(id: string): void {
    const items = this.loadFromStorage().filter(f => f.id !== id);
    this.saveToStorage(items);
  }

  /** 清空所有临时文件 */
  static clearAll(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  /** 获取未保存的临时文件数量 */
  static getUnsavedCount(): number {
    return this.loadFromStorage().length;
  }

  /** 确认保存：将临时文件写入 posts/ 目录（模拟提示） */
  static async confirmSave(id: string): Promise<boolean> {
    const file = this.getTemp(id);
    if (!file) return false;
    // 阶段二为模拟保存，阶段三对接真实 FileService
    console.log(`[TempFileManager] 确认保存: ${file.fileName}`);
    // await FileService.saveFile(file.fileName, file.content);
    this.deleteTemp(id);
    return true;
  }

  /** 批量确认保存 */
  static async confirmSaveAll(): Promise<number> {
    const items = this.loadFromStorage();
    for (const item of items) {
      await this.confirmSave(item.id);
    }
    return items.length;
  }

  // ===== 私有方法 =====

  private static loadFromStorage(): TempFileItem[] {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static saveToStorage(items: TempFileItem[]): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[TempFileManager] sessionStorage 写入失败:', e);
    }
  }

  /**
   * 生成文件名
   * 规则：
   *   - 首次: {源文件名}_标准化.md
   *   - 后续: {源文件名}_标准化_{version}.md
   */
  private static generateFileName(sourceFileName: string, version: number): string {
    const clean = this.sanitizeFileName(sourceFileName);
    if (version === 1) return `${clean}_标准化.md`;
    return `${clean}_标准化_${version}.md`;
  }

  /** 获取源文件名的下一个版本号 */
  private static getNextVersion(sourceFileName: string): number {
    const items = this.loadFromStorage();
    const existing = items.filter(f => f.sourceFileName === sourceFileName);
    return existing.length + 1;
  }

  /** 清洗文件名：去除非法字符 */
  private static sanitizeFileName(name: string): string {
    const cleaned = name.replace(/[\/\\:*?"<>|]/g, '_').trim();
    return cleaned || '未命名文档';
  }
}
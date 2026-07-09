/**
 * icon-manager.ts — 图标系统外观层（统一对外接口）
 * 
 * 这是图标系统的唯一外部入口。所有模块只需通过此文件引用图标功能。
 * 
 * 架构：
 *   ┌─────────────────────────────────┐
 *   │   外观层：icon-manager.ts       │ ← 外部只引用这个
 *   │   (统一接口、查询、工具函数)     │
 *   ├─────────────────────────────────┤
 *   │   渲染层：icon-renderer.ts      │
 *   │   (组件加载、静态映射、缓存)     │
 *   ├─────────────────────────────────┤
 *   │   配置层：icon-config.ts        │
 *   │   (类型定义、图标列表、元数据)   │
 *   └─────────────────────────────────┘
 * 
 * 特点：
 * - 高内聚：所有对外功能集中于此文件
 * - 低耦合：外部模块无需了解内部架构
 * - 便于引用：外部 import 统一路径
 */

// ===== 从内部模块重新导出所有功能 =====

// 类型和配置（从 icon-config 重新导出）
export type { IconConfig } from './icon-config';
export { SCENE_LIST, SCENE_LABELS, ICON_CONFIG } from './icon-config';

// 渲染功能（从 icon-renderer 重新导出）
export {
  getIconComponentSync,
  getIconComponentAsync,
  getComponentByName,
  iconComponentExists,
} from './icon-renderer';

// ===== icon-manager 特有的高级工具函数 =====

import { ICON_CONFIG } from './icon-config';
import { iconComponentExists } from './icon-renderer';

// 图标名称索引（name → component 名）
const iconMap = new Map<string, string>();
ICON_CONFIG.forEach(icon => {
  iconMap.set(icon.name, icon.component);
});

/**
 * 检查图标名是否存在（兼容旧代码）
 */
export const iconExists = (iconName: string): boolean => {
  return iconMap.has(iconName);
};

/**
 * 获取图标的标准名（别名→标准名，标准名→自身）
 */
export const getIconStandardName = (iconName: string): string | null => {
  const config = ICON_CONFIG.find(c => c.name === iconName);
  if (!config) return null;
  return config.primaryName || config.name;
};

/**
 * 根据场景分类获取图标配置列表
 */
export const getIconsByScene = (scene: string) => {
  return ICON_CONFIG.filter(icon => icon.scene === scene);
};

/**
 * 根据分类获取图标配置列表（兼容旧代码）
 */
export const getIconsByCategory = (category: string) => {
  return ICON_CONFIG.filter(icon => icon.category === category);
};

/**
 * 校验图标名是否是标准名（非别名）
 */
export const isStandardName = (iconName: string): boolean => {
  const config = ICON_CONFIG.find(c => c.name === iconName);
  return config ? !config.primaryName : false;
};

/**
 * 获取所有标准图标名列表（去重）
 */
export const getStandardIconNames = (): string[] => {
  const names: string[] = [];
  const seen = new Set<string>();
  ICON_CONFIG.forEach(icon => {
    const name = icon.primaryName || icon.name;
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  });
  return names.sort();
};

/**
 * 获取所有场景分组（按 scene 分类）
 */
export const getSceneGroups = (): Record<string, string[]> => {
  const groups: Record<string, string[]> = {};
  const seen = new Set<string>();
  ICON_CONFIG.forEach(icon => {
    const name = icon.primaryName || icon.name;
    if (seen.has(name)) return;
    seen.add(name);
    if (icon.scene) {
      if (!groups[icon.scene]) groups[icon.scene] = [];
      groups[icon.scene].push(name);
    }
  });
  return groups;
};

/**
 * 解析图标名（别名→标准名，无效→null）
 */
export const resolveIconName = (iconName: string): string | null => {
  const config = ICON_CONFIG.find(c => c.name === iconName);
  if (!config) return null;
  return config.primaryName || config.name;
};

/**
 * 获取所有图标配置（兼容旧代码）
 */
export const getAllIcons = () => ICON_CONFIG;

/**
 * 搜索图标
 */
export const searchIcons = (query: string) => {
  const lower = query.toLowerCase();
  return ICON_CONFIG.filter(icon =>
    icon.name.toLowerCase().includes(lower) ||
    icon.description?.toLowerCase().includes(lower)
  );
};
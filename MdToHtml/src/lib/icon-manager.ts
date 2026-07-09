/**
 * icon-manager.ts（旧路径 — 向后兼容重导出）
 * 
 * ⚠️ 注意：新代码请直接引用 @/lib/icon-system/icon-manager
 * 此文件仅为兼容旧引用而保留
 */

export type { IconConfig } from './icon-system/icon-config';
export {
  SCENE_LIST,
  SCENE_LABELS,
  ICON_CONFIG,
  getIconComponentSync,
  getIconComponentAsync,
  getComponentByName,
  iconComponentExists,
  iconExists,
  getIconStandardName,
  getIconsByScene,
  getIconsByCategory,
  isStandardName,
  getStandardIconNames,
  getSceneGroups,
  resolveIconName,
  getAllIcons,
  searchIcons,
} from './icon-system/icon-manager';
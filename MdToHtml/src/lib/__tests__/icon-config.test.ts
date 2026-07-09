/**
 * icon-config.test.ts — 配置层单元测试
 * 
 * 测试项：
 * 1. ICON_CONFIG 条目数量
 * 2. 所有标准名符合命名规范（全小写+连字符）
 * 3. 所有 primaryName 目标都存在
 * 4. 所有条目都有 scene 分类
 * 5. scene 分类都在 SCENE_LIST 中
 * 6. scene 都有对应的中文标签
 */

import { ICON_CONFIG, SCENE_LIST, SCENE_LABELS, IconConfig } from '../icon-system/icon-config';

describe('icon-config', () => {
  describe('ICON_CONFIG', () => {
    it('should have at least 130 entries', () => {
      expect(ICON_CONFIG.length).toBeGreaterThanOrEqual(130);
    });

    it('should have entries with required fields', () => {
      ICON_CONFIG.forEach((icon: IconConfig, index: number) => {
        expect(icon.name).toBeTruthy();
        expect(icon.component).toBeTruthy();
        expect(icon.category).toBeTruthy();
        expect(icon.scene).toBeTruthy();
      });
    });

    it('should have unique names', () => {
      const names = ICON_CONFIG.map(icon => icon.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('命名规范', () => {
    const hyphenPattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

    it('should have all standard names (no primaryName) follow hyphen convention', () => {
      const standards = ICON_CONFIG.filter(icon => !icon.primaryName);
      const invalidNames = standards
        .filter(icon => !hyphenPattern.test(icon.name))
        .map(icon => icon.name);
      
      expect(invalidNames).toEqual([]);
    });

    it('should have all primaryName targets exist as standard names', () => {
      const standardNames = new Set(
        ICON_CONFIG.filter(icon => !icon.primaryName).map(icon => icon.name)
      );
      
      const missingTargets = ICON_CONFIG
        .filter(icon => icon.primaryName && !standardNames.has(icon.primaryName))
        .map(icon => `${icon.name} → ${icon.primaryName}`);
      
      expect(missingTargets).toEqual([]);
    });
  });

  describe('scene 分类', () => {
    it('should have 16 scene categories', () => {
      expect(SCENE_LIST.length).toBe(16);
    });

    it('should have all entries assigned a valid scene', () => {
      const validScenes = new Set(SCENE_LIST);
      const invalidScenes = ICON_CONFIG
        .filter(icon => !validScenes.has(icon.scene as any))
        .map(icon => `${icon.name}: scene="${icon.scene}"`);
      
      expect(invalidScenes).toEqual([]);
    });

    it('should have at least 3 icons per scene', () => {
      const sceneCounts: Record<string, number> = {};
      ICON_CONFIG.forEach(icon => {
        if (icon.scene) {
          sceneCounts[icon.scene] = (sceneCounts[icon.scene] || 0) + 1;
        }
      });

      for (const [scene, count] of Object.entries(sceneCounts)) {
        expect(count).toBeGreaterThanOrEqual(3);
      }
    });

    it('should have Chinese labels for all scenes', () => {
      SCENE_LIST.forEach(scene => {
        expect(SCENE_LABELS[scene]).toBeTruthy();
      });
    });
  });

  describe('向后兼容别名', () => {
    it('should have primaryName for all alias entries', () => {
      const aliases = ICON_CONFIG.filter(icon => icon.primaryName);
      expect(aliases.length).toBeGreaterThanOrEqual(10);

      aliases.forEach(icon => {
        // 原名称不应等于 primaryName
        expect(icon.name).not.toBe(icon.primaryName);
      });
    });
  });
});
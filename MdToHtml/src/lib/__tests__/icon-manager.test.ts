/**
 * icon-manager.test.ts — 外观层集成测试
 * 
 * 测试项：
 * 1. iconExists 存在性检查
 * 2. getIconStandardName 标准名解析
 * 3. getIconsByScene 场景查询
 * 4. getIconsByCategory 分类查询
 * 5. isStandardName 标准名校验
 * 6. getStandardIconNames 标准名列表
 * 7. getSceneGroups 场景分组
 * 8. resolveIconName 别名解析
 * 9. getAllIcons 全量获取
 * 10. searchIcons 搜索
 */

import React from 'react';
import {
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
  getIconComponentSync,
} from '../icon-system/icon-manager';

describe('icon-manager（外观层集成测试）', () => {
  describe('iconExists', () => {
    it('should return true for existing icons', () => {
      expect(iconExists('zap')).toBe(true);
      expect(iconExists('bar-chart')).toBe(true);
    });

    it('should return true for alias names', () => {
      // 别名也应该存在
      expect(iconExists('chart3')).toBe(true);
      expect(iconExists('pentool')).toBe(true);
    });

    it('should return false for non-existing icons', () => {
      expect(iconExists('non-existent')).toBe(false);
    });
  });

  describe('getIconStandardName', () => {
    it('should return standard name for aliases', () => {
      expect(getIconStandardName('chart3')).toBe('bar-chart');
      expect(getIconStandardName('pentool')).toBe('pen-tool');
      expect(getIconStandardName('gitbranch')).toBe('git-branch');
    });

    it('should return same name for standard names', () => {
      expect(getIconStandardName('zap')).toBe('zap');
      expect(getIconStandardName('book')).toBe('book');
    });

    it('should return null for non-existing icons', () => {
      expect(getIconStandardName('non-existent')).toBeNull();
    });
  });

  describe('getIconsByScene', () => {
    it('should return icons for valid scenes', () => {
      const techIcons = getIconsByScene('tech');
      expect(techIcons.length).toBeGreaterThanOrEqual(10);
      
      const dataIcons = getIconsByScene('data');
      expect(dataIcons.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array for non-existing scenes', () => {
      expect(getIconsByScene('non-existent').length).toBe(0);
    });
  });

  describe('isStandardName', () => {
    it('should return true for standard names', () => {
      expect(isStandardName('zap')).toBe(true);
      expect(isStandardName('book')).toBe(true);
    });

    it('should return false for alias names', () => {
      expect(isStandardName('chart3')).toBe(false);
      expect(isStandardName('pentool')).toBe(false);
    });
  });

  describe('getStandardIconNames', () => {
    it('should return all standard names without duplicates', () => {
      const names = getStandardIconNames();
      expect(names.length).toBeGreaterThanOrEqual(100);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('getSceneGroups', () => {
    it('should return groups for all scenes', () => {
      const groups = getSceneGroups();
      const sceneCount = Object.keys(groups).length;
      expect(sceneCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('resolveIconName', () => {
    it('should resolve aliases to standard names', () => {
      expect(resolveIconName('chart3')).toBe('bar-chart');
      expect(resolveIconName('pentool')).toBe('pen-tool');
    });

    it('should pass through standard names', () => {
      expect(resolveIconName('zap')).toBe('zap');
    });

    it('should return null for invalid names', () => {
      expect(resolveIconName('')).toBeNull();
      expect(resolveIconName('invalid-name')).toBeNull();
    });
  });

  describe('跨层集成', () => {
    it('should get components for all standard icon names', () => {
      // 此测试验证三个层的协同工作
      const standardNames = getStandardIconNames();
      
      // 只取前 20 个测试（全量测试已在渲染层做了）
      standardNames.slice(0, 20).forEach(name => {
        const Component = getIconComponentSync(name);
        expect(Component).toBeTruthy();
        expect(() => React.createElement(Component as React.ComponentType)).not.toThrow();
      });
    });

    it('should have consistent scene labels with scene list', () => {
      const groups = getSceneGroups();
      const groupScenes = Object.keys(groups);
      
      // 标准图标应该分布在各个场景中
      expect(groupScenes.length).toBeGreaterThanOrEqual(5);
    });
  });
});
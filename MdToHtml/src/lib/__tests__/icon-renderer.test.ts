/**
 * icon-renderer.test.ts — 渲染层单元测试
 * 
 * 注意：Lucide 图标组件编译后为 forwardRef 对象，
 * 因此 typeof 可能返回 'object' 而非 'function'。
 * 验证方式：创建 React 元素检查是否可渲染。
 */

import React from 'react';
import {
  getIconComponentSync,
  getComponentByName,
  iconComponentExists,
} from '../icon-system/icon-renderer';
import { ICON_CONFIG } from '../icon-system/icon-config';

describe('icon-renderer', () => {
  describe('getIconComponentSync', () => {
    it('should return a component for valid icon names', () => {
      const testCases = ['zap', 'cpu', 'book', 'brain', 'alert-triangle', 'bar-chart'];
      
      testCases.forEach(iconName => {
        const Component = getIconComponentSync(iconName);
        expect(Component).toBeTruthy();
        // 验证可以创建 React 元素（组件是可渲染的）
        expect(() => React.createElement(Component as React.ComponentType)).not.toThrow();
      });
    });

    it('should return null for invalid icon names', () => {
      expect(getIconComponentSync('nonexistent-icon')).toBeNull();
      expect(getIconComponentSync('')).toBeNull();
      expect(getIconComponentSync('123')).toBeNull();
    });

    it('should work for all standard icons in ICON_CONFIG', () => {
      const standards = ICON_CONFIG.filter(icon => !icon.primaryName);
      
      standards.forEach(icon => {
        const Component = getIconComponentSync(icon.name);
        expect(Component).toBeTruthy();
        expect(() => React.createElement(Component as React.ComponentType)).not.toThrow();
      });
    });
  });

  describe('getComponentByName', () => {
    it('should return component for valid component names', () => {
      const Component = getComponentByName('Zap');
      expect(Component).toBeTruthy();
      expect(() => React.createElement(Component as React.ComponentType)).not.toThrow();
    });

    it('should return null for invalid component names', () => {
      expect(getComponentByName('NonExistentComponent')).toBeNull();
    });
  });

  describe('iconComponentExists', () => {
    it('should return true for existing icons', () => {
      expect(iconComponentExists('zap')).toBe(true);
      expect(iconComponentExists('alert-triangle')).toBe(true);
      expect(iconComponentExists('brain')).toBe(true);
    });

    it('should return false for non-existing icons', () => {
      expect(iconComponentExists('non-existent')).toBe(false);
      expect(iconComponentExists('')).toBe(false);
    });
  });
});
/**
 * CHD 渲染引擎架构升级 - 核心接口定义验证
 * 
 * 此文件用于验证布局策略模式 (Layout Strategy Pattern) 和 
 * 样式组合模式 (Composition Pattern) 在 TypeScript 类型系统中的可行性。
 * 
 * 目标：解耦布局逻辑与渲染实现，支持未来无限扩展。
 */

import React from 'react';

// ==========================================
// 1. 基础类型定义 (Basic Types)
// ==========================================

export type LayoutType = 'grid' | 'list' | 'gallery' | 'canvas' | 'timeline' | 'hub';
export type CardShape = 'rect' | 'circle' | 'pill' | 'hexagon' | 'diamond' | 'ticket' | 'message';

// 坐标与尺寸 (支持像素、百分比、视口单位)
export type CSSUnit = string; // e.g., '100px', '50%', '10rem'

// ==========================================
// 2. 布局策略接口 (Layout Strategy Interface)
// ==========================================

/**
 * 布局上下文：传递给布局策略的数据
 */
export interface LayoutContext {
  sectionId: string;
  cards: CardData[];
  config: Record<string, any>; // 来自 :: section { ... } 的原始属性
  isMobile: boolean;           // 响应式状态
}

/**
 * 核心策略接口：所有布局必须实现此接口
 */
export interface ILayoutStrategy {
  /**
   * 唯一标识符
   */
  id: LayoutType;

  /**
   * 验证配置是否合法 (可选)
   */
  validateConfig?: (config: Record<string, any>) => string[]; // 返回错误信息数组

  /**
   * 计算容器样式
   */
  getContainerStyle: (ctx: LayoutContext) => React.CSSProperties;

  /**
   * 计算容器类名 (Tailwind)
   */
  getContainerClass: (ctx: LayoutContext) => string;

  /**
   * 渲染子卡片 (允许布局控制卡片的包裹方式)
   * 默认实现可以是简单的 map 渲染，但 timeline/hub 可能需要特殊的 wrapper
   */
  renderCards: (ctx: LayoutContext, CardComponent: React.FC<CardProps>) => React.ReactNode;
}

// ==========================================
// 3. 卡片数据结构 (Card Data Structure)
// ==========================================

export interface CardStyleConfig {
  shape?: CardShape;       // 形状
  bg?: string;             // 背景色/纹理
  border?: string;         // 边框样式
  shadow?: string;         // 阴影级别
  opacity?: number;        // 透明度
  blur?: string;           // 背景模糊 (backdrop-filter)
}

export interface CardPositionConfig {
  x?: CSSUnit;             // Left
  y?: CSSUnit;             // Top
  z?: number;              // Z-Index
  w?: CSSUnit;             // Width (覆盖默认)
  h?: CSSUnit;             // Height
  rot?: string;            // Rotation (deg)
  scale?: number;          // Scale factor
  anchor?: string;         // Transform origin
}

export interface CardData {
  id: string;
  title: string;
  content: string;
  // 原始属性解析结果
  props: {
    layout?: CardPositionConfig; // 位置相关
    style?: CardStyleConfig;     // 样式相关
    behavior?: Record<string, any>; // 交互相关 (link, action)
    [key: string]: any;
  };
}

// ==========================================
// 4. 组件 Props 定义 (Component Props)
// ==========================================

export interface SectionProps {
  title?: string;
  layout?: LayoutType;     // 默认为 'grid'
  config?: Record<string, any>;
  cards: CardData[];
}

export interface CardProps {
  data: CardData;
  // 布局策略可能会注入额外的样式或类名
  injectedStyle?: React.CSSProperties;
  injectedClass?: string;
}

// ==========================================
// 5. 策略注册表 (Strategy Registry)
// ==========================================

class LayoutRegistry {
  private static strategies: Map<LayoutType, ILayoutStrategy> = new Map();

  static register(strategy: ILayoutStrategy) {
    this.strategies.set(strategy.id, strategy);
  }

  static get(type: LayoutType): ILayoutStrategy {
    return this.strategies.get(type) || this.strategies.get('grid')!; // Fallback to Grid
  }
}

// ==========================================
// 6. 验证示例：Grid 策略实现 (POC)
// ==========================================

const GridLayoutStrategy: ILayoutStrategy = {
  id: 'grid',
  
  getContainerStyle: () => ({}), // Grid 主要靠 Tailwind 类名
  
  getContainerClass: ({ config, cards }) => {
    // 智能列数计算逻辑迁移至此
    const cols = config.columns || (cards.length > 4 ? 3 : cards.length);
    return `grid grid-cols-${cols} gap-6`;
  },
  
  renderCards: ({ cards }, CardComponent) => {
    return cards.map(card => (
      <div key={card.id} className={`col-span-${card.props.span || 1}`}>
        <CardComponent data={card} />
      </div>
    ));
  }
};

// ==========================================
// 7. 验证示例：Canvas 自由布局策略实现 (POC)
// ==========================================

const CanvasLayoutStrategy: ILayoutStrategy = {
  id: 'canvas',
  
  getContainerStyle: ({ config }) => ({
    position: 'relative',
    height: config.height || '600px', // Canvas 模式必须指定高度
    overflow: 'hidden'
  }),
  
  getContainerClass: () => 'w-full bg-slate-50 rounded-xl',
  
  renderCards: ({ cards }, CardComponent) => {
    return cards.map(card => {
      const pos = card.props.layout || {};
      // 将位置信息转换为 CSS 变量，高性能渲染
      const style = {
        '--x': pos.x || '0',
        '--y': pos.y || '0',
        '--rot': pos.rot || '0deg',
        '--z': pos.z || 1,
        position: 'absolute',
        transform: 'translate(var(--x), var(--y)) rotate(var(--rot))',
        zIndex: 'var(--z)'
      } as React.CSSProperties;

      return (
        <div key={card.id} style={style}>
          <CardComponent data={card} />
        </div>
      );
    });
  }
};

// 注册策略
LayoutRegistry.register(GridLayoutStrategy);
LayoutRegistry.register(CanvasLayoutStrategy);

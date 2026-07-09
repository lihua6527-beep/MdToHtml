/**
 * IconAutoFixService — 图标自动修正引擎
 * 
 * 职责：
 * 在 AI 生成的 Markdown 被解析后、渲染之前执行。
 * 自动拦截并修复 AI 常见的图标错误，保证同一 Section 内的图标使用一致。
 * 
 * 全链路容错架构的第2层（Catch — 在数据层拦截错误）
 * 
 * 修正策略：
 * 1. 全部卡片无图标 → 保持（不强制添加）
 * 2. 部分有/部分无 → 取众数有效图标补齐
 * 3. 全部有图标但部分无效 → 替换为众数有效图标
 * 4. 全部有图标且全部有效 → 保持（AI 的语义选择正确）
 * 5. 全部有图标但全部无效 → 清空所有图标（降级为无图标）
 */

import { iconExists } from '../../lib/icon-manager';

// ========== 数据模型 ==========

/** 单张卡片的图标信息 */
export interface CardIconInfo {
    blockIndex: number;         // 卡片在 blocks 数组中的索引
    iconName: string | null;    // 当前图标名（null = 无图标）
    isValid: boolean;           // 图标名是否在 icon-manager 中有效
}

/** 单个 Section 的图标信息 */
export interface SectionIconInfo {
    sectionTitle: string;       // Section 标题（用于日志）
    cards: CardIconInfo[];      // 该 Section 下所有卡片的图标信息
}

/** 单次修正记录 */
export interface FixRecord {
    cardIndex: number;          // 被修正的卡片索引
    from: string | null;        // 修正前的图标名（null = 无图标）
    to: string | null;          // 修正后的图标名（null = 清除图标）
    reason: string;             // 修正原因
}

/** 一个 Section 的修正报告 */
export interface SectionFixLog {
    sectionTitle: string;
    fixes: FixRecord[];
}

/** 修正引擎的输出 */
export interface AutoFixResult {
    fixedSections: SectionIconInfo[];  // 修正后的数据
    fixLog: SectionFixLog[];           // 修正日志（用于调试）
    totalFixes: number;                // 总修正次数
}

// ========== 默认降级图标 ==========

/**
 * 当修正引擎无法确定合适的图标时的默认图标
 * 使用 file-text 是因为它在语义上最中性，适合大多数文档场景
 */
export const DEFAULT_FALLBACK_ICON = 'file-text';

// ========== 核心修正引擎 ==========

/**
 * 图标自动修正引擎主函数
 * 
 * @param sections - 所有 Section 的图标信息
 * @returns 修正后的数据 + 修正日志
 */
export function autoFixIcons(sections: SectionIconInfo[]): AutoFixResult {
    const fixLog: SectionFixLog[] = [];
    let totalFixes = 0;

    const fixedSections = sections.map(section => {
        const sectionFixLog: SectionFixLog = {
            sectionTitle: section.sectionTitle,
            fixes: []
        };

        const { cards } = section;

        // Step 1: 校验每张卡片的图标是否在 icon-manager 中有效
        cards.forEach(card => {
            card.isValid = card.iconName !== null && iconExists(card.iconName);
        });

        // Step 2: 统计各类卡片数量
        const hasIconCards = cards.filter(c => c.iconName !== null);
        const noIconCards = cards.filter(c => c.iconName === null);
        const validIconCards = hasIconCards.filter(c => c.isValid);
        const invalidIconCards = hasIconCards.filter(c => !c.isValid);
        const hasAnyValidIcon = validIconCards.length > 0;

        // ===== 分支判断 =====

        // 情况1：全部无图标 → 保持（不强制添加图标）
        if (hasIconCards.length === 0) {
            return { ...section };
        }

        // 情况2：部分有图标、部分没有
        if (hasIconCards.length > 0 && noIconCards.length > 0) {
            if (hasAnyValidIcon) {
                // 有有效的图标 → 取众数补齐
                const mostUsedIcon = getMostUsedIcon(
                    validIconCards.map(c => c.iconName!)
                );
                
                noIconCards.forEach(card => {
                    sectionFixLog.fixes.push({
                        cardIndex: card.blockIndex,
                        from: null,
                        to: mostUsedIcon,
                        reason: '图标一致化：无图标卡片自动分配'
                    });
                    card.iconName = mostUsedIcon;
                    card.isValid = true;
                    totalFixes++;
                });
            } else {
                // 所有图标都无效 → 清空全部有图标的卡片
                hasIconCards.forEach(card => {
                    sectionFixLog.fixes.push({
                        cardIndex: card.blockIndex,
                        from: card.iconName,
                        to: null,
                        reason: `所有图标无效（"${card.iconName}"不存在），已清空`
                    });
                    card.iconName = null;
                    card.isValid = false;
                    totalFixes++;
                });
            }
        }

        // 情况3：全部有图标，但部分无效
        if (hasIconCards.length > 0 && noIconCards.length === 0 && invalidIconCards.length > 0) {
            if (hasAnyValidIcon) {
                // 部分有效 → 用众数有效图标替换无效的
                const mostUsedIcon = getMostUsedIcon(
                    validIconCards.map(c => c.iconName!)
                );
                
                invalidIconCards.forEach(card => {
                    sectionFixLog.fixes.push({
                        cardIndex: card.blockIndex,
                        from: card.iconName,
                        to: mostUsedIcon,
                        reason: `图标 "${card.iconName}" 不存在，替换为 "${mostUsedIcon}"`
                    });
                    card.iconName = mostUsedIcon;
                    card.isValid = true;
                    totalFixes++;
                });
            } else {
                // 全部无效 → 清空所有卡片图标
                cards.forEach(card => {
                    sectionFixLog.fixes.push({
                        cardIndex: card.blockIndex,
                        from: card.iconName,
                        to: null,
                        reason: `所有图标无效（"${card.iconName}"不存在），已清空`
                    });
                    card.iconName = null;
                    card.isValid = false;
                    totalFixes++;
                });
            }
        }

        // 情况4：全部有图标且全部有效 → 保持（无需任何操作）

        if (sectionFixLog.fixes.length > 0) {
            fixLog.push(sectionFixLog);
        }

        return { ...section, cards };
    });

    return {
        fixedSections,
        fixLog,
        totalFixes
    };
}

// ========== 辅助函数 ==========

/**
 * 获取图标列表中出现次数最多的图标（众数）
 * 如果列表为空，返回默认降级图标
 */
function getMostUsedIcon(icons: string[]): string {
    if (icons.length === 0) {
        return DEFAULT_FALLBACK_ICON;
    }
    
    const counts = new Map<string, number>();
    icons.forEach(icon => {
        counts.set(icon, (counts.get(icon) || 0) + 1);
    });
    
    // 按出现次数降序排列，取第一个
    // 使用 Array.from 代替 spread 操作符以兼容 tsc 5.x 的 --target 限制
    const entries = Array.from(counts.entries());
    return entries.sort((a, b) => b[1] - a[1])[0][0];
}

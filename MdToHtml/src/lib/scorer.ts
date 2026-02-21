import { ScoreResponse, Issue, ScoreDimensions } from '../types/model-interface';
import matter from 'gray-matter';

/**
 * 简单的基于规则的评分引擎
 * 对应 "The Scorer" 模型，用于前端快速评估
 */
export class RuleBasedScorer {
  /**
   * 评估 Markdown 内容
   * @param content 原始 Markdown 字符串
   * @returns 评分响应
   */
  static evaluate(content: string): ScoreResponse {
    const issues: Issue[] = [];
    
    // 0. 空内容检查 (Critical)
    if (!content || content.trim().length === 0) {
        return {
            totalScore: 0,
            dimensions: {
                structure: 0,
                atomicity: 0,
                metadata: 0,
                syntax: 0,
                styling: 0
            },
            issues: [{
                line: 1,
                type: 'critical_empty_content',
                message: '文档内容为空，无法评分。请确保文件包含有效的 Markdown 内容。',
                severity: 'error'
            }]
        };
    }

    const lines = content.split('\n');
    
    // 1. 结构规范性 (30分) - CHD 核心结构
    const structureScore = this.evaluateStructure(lines, issues);
    
    // 2. 内容原子性 (20分) - 卡片长度与分割
    const atomicityScore = this.evaluateAtomicity(lines, issues);
    
    // 3. 元数据完整性 (10分) - Frontmatter
    const metadataScore = this.evaluateMetadata(content, issues);
    
    // 4. 语法正确性 (10分) - Markdown 基础语法
    const syntaxScore = this.evaluateSyntax(lines, issues);

    // 5. 样式与布局 (30分) - 视觉呈现与Grid布局
    const stylingScore = this.evaluateStyling(lines, issues);

    const dimensions: ScoreDimensions = {
      structure: structureScore,
      atomicity: atomicityScore,
      metadata: metadataScore,
      syntax: syntaxScore,
      styling: stylingScore // New Dimension
    };

    const totalScore = Math.round(
      structureScore * 0.3 +
      atomicityScore * 0.2 +
      metadataScore * 0.1 +
      syntaxScore * 0.1 +
      stylingScore * 0.3
    );

    return {
      totalScore,
      dimensions,
      issues
    };
  }

  // --- 内部评估逻辑 ---

  private static evaluateStyling(lines: string[], issues: Issue[]): number {
    let score = 100;
    let hasGrid = false;
    let inSection = false;
    let sectionLine = 0;

    lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Check Section Attributes
        if (/^##\s/.test(line)) {
            inSection = true;
            sectionLine = lineNum;
            
            // Check for layout="grid"
            if (/layout=["']grid["']/.test(line)) {
                hasGrid = true;
                
                // Validate Grid Attributes
                if (!/columns=/.test(line)) {
                    score -= 5;
                    issues.push({
                        line: lineNum,
                        type: 'styling_grid_missing_columns',
                        message: 'Grid 布局建议显式定义 columns 属性 (e.g., columns="1fr 1fr")。',
                        severity: 'warning'
                    });
                }
                
                // Validate Quotes in complex attributes
                if (/areas=[^"']*[^"'\s]/.test(line) && !/areas=["'].*["']/.test(line)) {
                     // Simple check for unquoted areas which might break parser
                     // Actually parser is robust now, but for best practice:
                }
            }
        }

        // Check Card Attributes
        if (/^###\s/.test(line)) {
             // Check card-style validity
             const styleMatch = line.match(/card-style=["']([^"']+)["']/);
             if (styleMatch) {
                 const style = styleMatch[1];
                 const validStyles = ['normal', 'highlight', 'stat', 'quote', 'code', 'summary', 'orange'];
                 if (!validStyles.includes(style)) {
                     score -= 5;
                     issues.push({
                         line: lineNum,
                         type: 'styling_invalid_card_style',
                         message: `不支持的 card-style: "${style}"。有效值: ${validStyles.join(', ')}。`,
                         severity: 'warning'
                     });
                 }
                 
                 // Stat card constraint
                 if (style === 'stat') {
                     // Look ahead for table or code block in next few lines? 
                     // Hard to do in single pass without state machine, keeping simple for now.
                 }
             }
             
             // Check Grid Area usage
             if (hasGrid && !/area=/.test(line) && !/col-span=/.test(line) && !/row-span=/.test(line)) {
                 // Not strictly an error, auto-placement works, but explicit area is better for complex grids
             }
        }
    });

    return Math.max(0, score);
  }

  private static evaluateStructure(lines: string[], issues: Issue[]): number {
    let score = 100;
    let inSection = false;
    let hasCard = false;

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // 检查非法深层标题 (H4-H6)
      if (/^#{4,6}\s/.test(line)) {
        score -= 5;
        issues.push({
          line: lineNum,
          type: 'structure_deep_heading',
          message: '检测到 H4-H6 深层标题，CHD 协议仅支持三级结构 (Doc > Section > Card)。',
          severity: 'error',
          suggestion: '请将标题降级为 H3 或改为粗体文本。'
        });
      }

      // 检查 Section 容器 (H2)
      if (/^##\s/.test(line)) {
        inSection = true;
        hasCard = false;
      }

      // 检查 Card (H3)
      if (/^###\s/.test(line)) {
        if (!inSection) {
          score -= 5;
          issues.push({
            line: lineNum,
            type: 'structure_orphan_card',
            message: '发现孤立的卡片 (H3)，它必须位于 Section (H2) 内部。',
            severity: 'error'
          });
        }
        hasCard = true;
      }

      // 检查 H2 下直接出现文本 (非空行，非标题，非 Frontmatter)
      if (inSection && !hasCard && line.trim() && !line.startsWith('#') && line !== '---') {
        // 忽略 Frontmatter 区域 (简单判断)
        if (lineNum > 5) { 
           score -= 2;
           issues.push({
             line: lineNum,
             type: 'structure_content_in_section',
             message: 'Section (H2) 下不应直接包含内容，请将其包裹在 Card (H3) 中。',
             severity: 'warning'
           });
        }
      }
    });

    return Math.max(0, score);
  }

  private static evaluateAtomicity(lines: string[], issues: Issue[]): number {
    let score = 100;
    let currentCardLength = 0;
    let cardStartLine = 0;

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      if (/^###\s/.test(line)) {
        // 结算上一张卡片
        if (currentCardLength > 500) {
          score -= 10;
          issues.push({
            line: cardStartLine,
            type: 'atomicity_card_too_long',
            message: `卡片内容过长 (${currentCardLength} 字)，建议拆分。`,
            severity: 'warning'
          });
        }
        currentCardLength = 0;
        cardStartLine = lineNum;
      } else {
        currentCardLength += line.length;
      }

      // 检查代码块混排 (简单检测：代码块上下是否有大量文本)
      // 这里简化为：如果一行既有代码又有长文本... 其实比较难检测，暂略，改为检测段落长度
      if (line.length > 300) {
         score -= 5;
         issues.push({
           line: lineNum,
           type: 'atomicity_paragraph_too_long',
           message: '段落过长，建议拆分为多行或列表。',
           severity: 'info'
         });
      }
    });

    return Math.max(0, score);
  }

  private static evaluateMetadata(content: string, issues: Issue[]): number {
    let score = 100;
    try {
      const { data } = matter(content);
      
      if (!data.title) {
        score -= 20;
        issues.push({
          line: 1,
          type: 'metadata_missing_title',
          message: 'Frontmatter 缺失 title 字段。',
          severity: 'error'
        });
      }
      
      if (!data.date) {
        score -= 10;
        issues.push({
          line: 1,
          type: 'metadata_missing_date',
          message: 'Frontmatter 缺失 date 字段。',
          severity: 'warning'
        });
      }

    } catch (e) {
      score = 0;
      issues.push({
        line: 1,
        type: 'metadata_invalid_yaml',
        message: 'Frontmatter 解析失败，请检查 YAML 语法。',
        severity: 'error'
      });
    }

    return Math.max(0, score);
  }

  private static evaluateSyntax(lines: string[], issues: Issue[]): number {
    let score = 100;
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // 检查本地绝对路径链接
      if (/\]\([A-Za-z]:\\/.test(line) || /\]\(\/Users\//.test(line)) {
        score -= 5;
        issues.push({
          line: lineNum,
          type: 'syntax_absolute_path',
          message: '检测到本地绝对路径，请使用相对路径或网络链接。',
          severity: 'error'
        });
      }

      // 检查未闭合的加粗/斜体 (简单的奇数个 * 检测)
      const stars = (line.match(/\*/g) || []).length;
      if (stars % 2 !== 0 && !line.trim().startsWith('*') && !line.includes('`')) {
         // 排除列表项和代码块
         score -= 2;
         issues.push({
           line: lineNum,
           type: 'syntax_unclosed_formatting',
           message: '可能存在未闭合的 Markdown 格式标记 (*)。',
           severity: 'warning'
         });
      }
    });

    return Math.max(0, score);
  }
}

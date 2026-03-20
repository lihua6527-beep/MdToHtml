const matter = require('gray-matter');

const markdown = `title: "缓存系统分析与优化报告"
subtitle: "基于操作系统理论的高效元数据管理架构"
tags: ["缓存系统", "性能优化", "架构设计", "元数据管理"]
category: "project"
version: "1.0"
status: "done"

## 核心亮点 {layout="grid" columns=4 section-color="chart-1"}

### 双层缓存架构 {card-style="highlight" icon="layers"}

结合内存缓存 (Map) 与磁盘持久化缓存 (JSON)，实现高效文件元数据管理。`;

try {
  const parsed = matter(markdown);
  console.log('Frontmatter parsed successfully:');
  console.log(JSON.stringify(parsed.data, null, 2));
  console.log('Content preview:');
  console.log(parsed.content.substring(0, 100) + '...');
} catch (error) {
  console.error('Frontmatter parsing failed:', error);
}

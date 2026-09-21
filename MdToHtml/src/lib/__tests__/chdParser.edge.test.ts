/**
 * parseCHDBlocks — 边界与状态机用例
 *
 * 覆盖 CHD 解析器的核心难点（论文创新点之一）：
 *   - 代码块内的 Markdown 标题不得被误判为 section/card（状态机关键）
 *   - frontmatter 仅在第 0 行生效、未闭合时的行为
 *   - 代码块在卡片内外的不同归属
 *   - 行尾 CRLF、四级标题、无空格标题等格式边界
 *
 * 说明：输入以 '\n' 结尾时，split('\n') 会多出一个空行，该空行会通过
 * 「内容延伸」分支把当前块的 endLine 推进到它上面。这是当前实现的既有行为，
 * 下面的断言按真实输出编写（而非按直觉）。
 */
import { parseCHDBlocks } from '../chdParser';

describe('parseCHDBlocks — 基础结构', () => {
  it('解析 section 与 card', () => {
    const blocks = parseCHDBlocks('## Section 1\n### Card 1\nContent 1\n');
    expect(blocks.map((b) => b.type)).toEqual(['section', 'card']);
    expect(blocks[0].title).toBe('Section 1');
    expect(blocks[0].level).toBe(1);
    expect(blocks[1].title).toBe('Card 1');
    expect(blocks[1].level).toBe(2);
  });

  it('空文档返回空数组', () => {
    expect(parseCHDBlocks('')).toEqual([]);
  });

  it('段落内容会被并入当前块并推进 endLine', () => {
    const blocks = parseCHDBlocks('## S\nline1\nline2\n');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].endLine).toBe(3); // 含结尾换行产生的空行
  });

  it('同一 section 下的多张卡片各自独立成块', () => {
    const blocks = parseCHDBlocks('## S\n### A\nx\n### B\ny\n');
    expect(blocks.map((b) => b.type)).toEqual(['section', 'card', 'card']);
    expect(blocks[1].title).toBe('A');
    expect(blocks[1].startLine).toBe(1);
    expect(blocks[1].endLine).toBe(2);
    expect(blocks[2].title).toBe('B');
    expect(blocks[2].startLine).toBe(3);
  });

  it('卡片紧跟 section 时，section 的结束行不越界', () => {
    const blocks = parseCHDBlocks('## S\n### C\n');
    expect(blocks[0].startLine).toBe(0);
    expect(blocks[0].endLine).toBe(0);
  });

  it('id 由行号生成且稳定', () => {
    const blocks = parseCHDBlocks('## S\n### C\n');
    expect(blocks[0].id).toBe('section-0');
    expect(blocks[1].id).toBe('card-1');
  });
});

describe('parseCHDBlocks — 代码块状态机', () => {
  it('顶层代码块单独成块，title 取语言标识', () => {
    const blocks = parseCHDBlocks('## S\n```typescript\nconst x = 1;\n```\n');
    expect(blocks.map((b) => b.type)).toEqual(['section', 'code']);
    expect(blocks[1].title).toBe('typescript');
    expect(blocks[1].startLine).toBe(2);
    expect(blocks[1].endLine).toBe(2); // 不含结束的 ```
  });

  it('无语言标识的代码块 title 为空字符串', () => {
    const blocks = parseCHDBlocks('## S\n```\nplain\n```\n');
    expect(blocks[1].type).toBe('code');
    expect(blocks[1].title).toBe('');
  });

  it('关键：代码块内的 ### 不得被解析为卡片', () => {
    const md = '## S\n```markdown\n### NotACard\n```\n';
    const blocks = parseCHDBlocks(md);
    expect(blocks.map((b) => b.type)).toEqual(['section', 'code']);
    expect(blocks.some((b) => b.type === 'card')).toBe(false);
  });

  it('关键：代码块内的 ## 不得被解析为额外 section', () => {
    const md = '## S\n```markdown\n## FakeSection\n### FakeCard\n```\n';
    const blocks = parseCHDBlocks(md);
    // 只有文档中真实存在的那一个 section；代码块内的标题一律不解析
    expect(blocks.filter((b) => b.type === 'section')).toHaveLength(1);
    expect(blocks.filter((b) => b.type === 'card')).toHaveLength(0);
    expect(blocks.filter((b) => b.type === 'code')).toHaveLength(1);
  });

  it('已知局限：文档以代码块开头（前面没有任何块）时，该代码块会被丢弃', () => {
    // 源码中仅当 currentBlock 已存在时才新建 code 块；
    // 若代码块出现在任何 section/card 之前，块会丢失。
    // 实际 CHD 文档以 frontmatter/section 开头，因此影响有限，此处记录现状。
    expect(parseCHDBlocks('```\ncode\n```\n')).toEqual([]);
  });

  it('卡片内的代码块被并入卡片，不单独成块', () => {
    const blocks = parseCHDBlocks('### C\n```ts\nx\n```\n');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('card');
    expect(blocks[0].endLine).toBe(4);
  });

  it('未闭合的代码块在文档结束时收尾', () => {
    const blocks = parseCHDBlocks('## S\n```ts\nlet a = 1;\n');
    expect(blocks.map((b) => b.type)).toEqual(['section', 'code']);
    expect(blocks[1].endLine).toBe(3);
  });
});

describe('parseCHDBlocks — frontmatter', () => {
  it('首行 --- 开启 frontmatter，并在第二个 --- 处闭合', () => {
    const blocks = parseCHDBlocks('---\ntitle: x\ntags: a\n---\n## S\n');
    expect(blocks[0].type).toBe('frontmatter');
    expect(blocks[0].title).toBe('Metadata');
    expect(blocks[0].level).toBe(0);
    expect(blocks[0].id).toBe('frontmatter');
    expect(blocks[0].endLine).toBe(3);
    expect(blocks[1].type).toBe('section');
  });

  it('frontmatter 内的标题行不会被当作结构解析', () => {
    const blocks = parseCHDBlocks('---\n### not-a-card\n---\n');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('frontmatter');
  });

  it('未闭合的 frontmatter 也能收尾', () => {
    const blocks = parseCHDBlocks('---\ntitle: x\n');
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('frontmatter');
    expect(blocks[0].endLine).toBe(2);
  });

  it('非首行的 --- 不触发 frontmatter，也不产生任何块', () => {
    expect(parseCHDBlocks('正文\n---\n')).toEqual([]);
  });
});

describe('parseCHDBlocks — 格式边界', () => {
  it('四级标题 #### 视为普通内容而非卡片', () => {
    const blocks = parseCHDBlocks('## S\n#### H4\n');
    expect(blocks.map((b) => b.type)).toEqual(['section']);
    expect(blocks[0].endLine).toBe(2);
  });

  it('无空格的 ## 标题视为普通内容', () => {
    expect(parseCHDBlocks('##NoSpace\n')).toEqual([]);
    expect(parseCHDBlocks('###NoSpace\n')).toEqual([]);
  });

  it('兼容 CRLF 行尾', () => {
    const blocks = parseCHDBlocks('## S\r\n### C\r\ncontent\r\n');
    expect(blocks.map((b) => b.type)).toEqual(['section', 'card']);
    expect(blocks[0].title).toBe('S');
    expect(blocks[1].title).toBe('C');
  });

  it('标题两侧多余空格会被裁剪', () => {
    const blocks = parseCHDBlocks('##   S  \n###   C  \n');
    expect(blocks[0].title).toBe('S');
    expect(blocks[1].title).toBe('C');
  });

  it('levels 与 types 对应正确', () => {
    const blocks = parseCHDBlocks('---\nk: v\n---\n## S\n### C\n');
    expect(blocks.map((b) => [b.type, b.level])).toEqual([
      ['frontmatter', 0],
      ['section', 1],
      ['card', 2],
    ]);
  });
});

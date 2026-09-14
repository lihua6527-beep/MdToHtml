/**
 * parseAttributes — 边界用例
 *
 * 关键规则（与实现一致）：
 *   1. 只认最后一个 `{`（lastIndexOf），因此属性块必须在文本尾部或最后一段
 *   2. 花括号内容必须含 `=`，否则整段视为普通文本，不做剥离
 *   3. 支持中文花括号 ｛｝（会被归一化）
 *   4. 支持 key="v" / key='v' / key=v 三种写法
 */
import { parseAttributes } from '../attributeParser';

describe('parseAttributes — 空输入与无属性', () => {
  it('空字符串返回空结果', () => {
    expect(parseAttributes('')).toEqual({ cleanText: '', props: {} });
  });

  it('不含花括号时只做 trim', () => {
    expect(parseAttributes('  纯文本  ')).toEqual({ cleanText: '纯文本', props: {} });
  });

  it('花括号内没有 = 时视为普通文本，不剥离', () => {
    expect(parseAttributes('正文 {grid}')).toEqual({ cleanText: '正文 {grid}', props: {} });
  });
});

describe('parseAttributes — 基本解析', () => {
  it('解析多属性并剥离属性块', () => {
    const r = parseAttributes('卡片内容{layout="grid" colspan="2"}');
    expect(r.props).toEqual({ layout: 'grid', colspan: '2' });
    expect(r.cleanText).toBe('卡片内容');
  });

  it('解析标准的 key="value" 写法', () => {
    const r = parseAttributes('正文{layout="grid" span="2"}');
    expect(r.props).toEqual({ layout: 'grid', span: '2' });
    expect(r.cleanText).toBe('正文');
  });

  it('支持单引号写法', () => {
    const r = parseAttributes("正文{layout='grid'}");
    expect(r.props).toEqual({ layout: 'grid' });
    expect(r.cleanText).toBe('正文');
  });

  it('支持无引号写法', () => {
    const r = parseAttributes('正文{color=red}');
    expect(r.props).toEqual({ color: 'red' });
    expect(r.cleanText).toBe('正文');
  });

  it('引号内的空格会被完整保留', () => {
    const r = parseAttributes('正文{title="a b c"}');
    expect(r.props).toEqual({ title: 'a b c' });
  });

  it('键允许包含下划线与短横线', () => {
    const r = parseAttributes('正文{justify_self="end" data-x="1"}');
    expect(r.props).toEqual({ justify_self: 'end', 'data-x': '1' });
  });
});

describe('parseAttributes — 中文花括号与位置规则', () => {
  it('中文花括号会被归一化处理', () => {
    const r = parseAttributes('正文｛layout="grid"｝');
    expect(r.props).toEqual({ layout: 'grid' });
    expect(r.cleanText).toBe('正文');
  });

  it('只取最后一个 { 之后的属性块', () => {
    const r = parseAttributes('{a="1"}正文{layout="grid"}');
    expect(r.props).toEqual({ layout: 'grid' });
    expect(r.cleanText).toBe('{a="1"}正文');
  });

  it('属性块位于中间时，两侧文本被拼接', () => {
    const r = parseAttributes('前{a="1"}后');
    expect(r.props).toEqual({ a: '1' });
    expect(r.cleanText).toBe('前后');
  });

  it('花括号未闭合时，从 { 到结尾视为属性块', () => {
    const r = parseAttributes('正文{layout="grid"');
    expect(r.props).toEqual({ layout: 'grid' });
    expect(r.cleanText).toBe('正文');
  });

  it('未闭合且解析不出键值对时：props 为空，但属性块仍被剥离（为输入中的实时预览设计）', () => {
    // 实现中若内容含 '=' 即视为属性块；即使正则匹配不到键值对，
    // 只要存在 '{' 就会把其后内容从正文中剥离（见源码注释：for typing support）
    const r = parseAttributes('正文{layout=');
    expect(r.props).toEqual({});
    expect(r.cleanText).toBe('正文');
  });
});

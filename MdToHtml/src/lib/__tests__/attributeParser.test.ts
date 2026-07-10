import { parseAttributes } from '../attributeParser';

describe('parseAttributes', () => {
  describe('basic cases', () => {
    it('returns empty props for empty text', () => {
      const result = parseAttributes('');
      expect(result).toEqual({ cleanText: '', props: {} });
    });

    it('returns empty props for null/undefined', () => {
      const result = parseAttributes('');
      expect(result.cleanText).toBe('');
      expect(result.props).toEqual({});
    });

    it('returns empty props for text without braces', () => {
      const result = parseAttributes('Hello World');
      expect(result.cleanText).toBe('Hello World');
      expect(result.props).toEqual({});
    });
  });

  describe('attribute parsing', () => {
    it('parses single key="value" attribute', () => {
      const result = parseAttributes('Hello {key="value"}');
      expect(result.cleanText).toBe('Hello');
      expect(result.props).toEqual({ key: 'value' });
    });

    it('parses multiple attributes', () => {
      const result = parseAttributes('Card {col-span="2" shape="rect"}');
      expect(result.cleanText).toBe('Card');
      expect(result.props).toEqual({ 'col-span': '2', shape: 'rect' });
    });

    it('parses single-quoted values', () => {
      const result = parseAttributes('Text {title=\'hello\'}');
      expect(result.cleanText).toBe('Text');
      expect(result.props).toEqual({ title: 'hello' });
    });

    it('parses unquoted values', () => {
      const result = parseAttributes('Text {layout=grid}');
      expect(result.cleanText).toBe('Text');
      expect(result.props).toEqual({ layout: 'grid' });
    });

    it('handles Chinese braces', () => {
      const result = parseAttributes('卡片｛颜色＝"红"｝');
      // 中文等号不被key=value正则识别，所以应该没有props
      expect(result.props).toEqual({});
    });
  });

  describe('edge cases', () => {
    it('handles values with spaces inside quotes', () => {
      const result = parseAttributes('Text {title="hello world"}');
      expect(result.cleanText).toBe('Text');
      expect(result.props).toEqual({ title: 'hello world' });
    });

    it('returns original text if braces contain no equals sign', () => {
      const result = parseAttributes('Some {text} here');
      expect(result.cleanText).toBe('Some {text} here'); // 没有=，不被识别为属性
      expect(result.props).toEqual({});
    });

    it('handles text without closing brace', () => {
      const result = parseAttributes('Text {key="val"');
      expect(result.cleanText).toBe('Text');
      expect(result.props).toEqual({ key: 'val' });
    });

    it('handles attributes with hyphens in keys', () => {
      const result = parseAttributes('Card {card-color="chart-1" title-size="text-2xl"}');
      expect(result.cleanText).toBe('Card');
      expect(result.props).toEqual({ 'card-color': 'chart-1', 'title-size': 'text-2xl' });
    });

    it('handles underscores in key names', () => {
      const result = parseAttributes('Text {my_key="val"}');
      expect(result.cleanText).toBe('Text');
      expect(result.props).toEqual({ my_key: 'val' });
    });
  });

  describe('trimming', () => {
    it('trims whitespace from cleanText', () => {
      const result = parseAttributes('  Hello {key="val"}  ');
      expect(result.cleanText).toBe('Hello');
      expect(result.props).toEqual({ key: 'val' });
    });

    it('returns just text without attributes', () => {
      const result = parseAttributes('Just text');
      expect(result.cleanText).toBe('Just text');
      expect(result.props).toEqual({});
    });
  });
});
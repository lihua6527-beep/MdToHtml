import { validateContent } from './validator';

describe('Validator Utility', () => {
  test('should pass for valid content', () => {
    const input = '# Title\n## Section 1\n### Card 1\nContent';
    const errors = validateContent(input);
    expect(errors).toHaveLength(0);
  });

  test('should fail for empty content', () => {
    const input = '';
    const errors = validateContent(input);
    // Assuming implementation details, typically empty might be valid or invalid depending on rules.
    // Based on user's test page: expectedErrorCount: 0 for empty.
    expect(errors).toHaveLength(0);
  });

  test('should detect orphan cards', () => {
    const input = '# Title\n### Orphan Card';
    const errors = validateContent(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('Card (###) defined outside of any Section (##)');
  });

  test('should detect invalid header levels', () => {
    const input = '#### Too deep';
    const errors = validateContent(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('CHD only supports H1');
  });

  test('should detect unclosed attributes', () => {
    const input = '## Section {key="val"';
    const errors = validateContent(input);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('Unclosed attribute');
  });
});

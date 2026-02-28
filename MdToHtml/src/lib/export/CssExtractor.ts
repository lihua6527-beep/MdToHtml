export class CssExtractor {
  /**
   * Extracts all CSS rules from the current document's stylesheets.
   * This ensures we capture all Tailwind utility classes and component styles used in the page.
   * 
   * Note: This extracts ALL loaded styles, which might include unused styles.
   * However, given the "Current Context" requirement, this is the safest way to ensure
   * the exported HTML looks identical to the editor preview without complex purging logic.
   */
  static extract(): string {
    if (typeof document === 'undefined') return '';
    
    let css = '';
    const styleSheets = Array.from(document.styleSheets);
    
    styleSheets.forEach(sheet => {
      try {
        // Skip external stylesheets that might cause CORS issues if we can't access cssRules
        // But try to access them anyway
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => {
          css += rule.cssText + '\n';
        });
      } catch (e) {
        console.warn('Access to stylesheet blocked (CORS) or empty:', sheet.href);
        // Fallback: If it's a link tag with same origin, we might fetch it?
        // For now, we rely on the fact that Next.js usually injects styles or uses relative paths
        // which might be accessible if served from same domain.
      }
    });
    
    return css;
  }
}

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHDRenderer } from '@/components/CHD/CHDRenderer';
import { CssExtractor } from './CssExtractor';
import { HTML_TEMPLATE } from './template';
import { ThemeProvider } from '@/components/ThemeProvider';

export class HtmlBundler {
  /**
   * Bundles the Markdown content into a single self-contained HTML file.
   * 
   * @param markdown The Markdown content to render.
   * @param title The title of the document.
   * @returns A Blob containing the complete HTML file.
   */
  static async bundle(markdown: string, title: string, theme: string = 'system'): Promise<Blob> {
    // 1. Render HTML Component to Static Markup
    // We wrap it in ThemeProvider to ensure theme context is available if needed
    // We strictly use editMode={false} to ensure a clean read-only view
    const htmlContent = renderToStaticMarkup(
      <ThemeProvider defaultTheme={theme}>
        <div className="chd-renderer-root">
            <CHDRenderer 
                markdown={markdown} 
                editMode={false} 
                // Pass empty callbacks as they are not needed for static render
                onCardClick={() => {}}
                onCardUpdate={() => {}}
                onBatchCardUpdate={() => {}}
                onContentUpdate={() => {}}
                onTitleUpdate={() => {}}
                onCardMove={() => {}}
                onCardDelete={() => {}}
                onCardAdd={() => {}}
            />
        </div>
      </ThemeProvider>
    );

    // 2. Extract CSS from the current browser context
    // This captures the exact styles currently applied to the page
    const css = CssExtractor.extract();

    // 3. Construct Theme Script
    // Since we now inject data-theme="{{THEME}}", the CSS variables are already active.
    // We only need to handle the .dark class IF the theme requires it.
    // However, the current system relies on [data-theme="ocean"] etc. 
    // And global .dark is separate.
    // If we want 1:1, we should pass 'darkMode' as well.
    // But for now, we assume the user just wants the Color Theme (ocean, mint, etc).
    // The previous logic was forcing dark mode based on system pref, which is WRONG if the editor is light.
    // So we remove the system preference check entirely to ensure consistency.
    const themeScript = `
        // Force sync theme
        document.documentElement.setAttribute('data-theme', '${theme}');
    `;

    // 4. Inject into Template
    // We use a safe replacement strategy
    const fullHtml = HTML_TEMPLATE
      .replace('{{TITLE}}', title || 'Untitled Document')
      .replace('{{THEME}}', theme) // Inject Theme ID into <html> tag
      .replace('{{CONTENT}}', htmlContent)
      .replace('{{CSS}}', css)
      .replace('{{THEME_SCRIPT}}', themeScript)
      .replace('{{SCRIPT}}', `
        // Interactive Script Placeholder
        // Future: Add folding logic here
        document.addEventListener('DOMContentLoaded', () => {
            console.log('Document loaded');
        });
      `);

    return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  }
}

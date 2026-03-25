/**
 * Theming Audit Tests
 *
 * Verifies BEM root class presence and CSS variable usage across
 * key components. This serves as a cross-cutting theming validation
 * rather than duplicating theming tests in every component spec.
 *
 * Categories: BEM Root Class, CSS Variable References
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */
// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const LIB_ROOT = path.resolve(__dirname, '..');
const COMPONENTS_DIR = path.join(LIB_ROOT, 'components');

/**
 * Collects all component directories that have a .component.ts file.
 */
function collectComponentDirs(dir: string): { name: string; cssPath: string; htmlPath: string }[] {
  const results: { name: string; cssPath: string; htmlPath: string }[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dir, entry.name);
    const cssFile = path.join(fullPath, `${entry.name}.component.css`);
    const htmlFile = path.join(fullPath, `${entry.name}.component.html`);
    if (fs.existsSync(cssFile)) {
      results.push({ name: entry.name, cssPath: cssFile, htmlPath: htmlFile });
    }
    // Recurse into subdirectories (e.g., base-elements)
    results.push(...collectComponentDirs(fullPath));
  }
  return results;
}

describe('Theming Audit', () => {
  const components = collectComponentDirs(COMPONENTS_DIR);

  describe('BEM Root Class Presence', () => {
    it('should find components to audit', () => {
      expect(components.length).toBeGreaterThan(0);
    });

    it.each(components.map(c => [c.name, c.cssPath]))(
      '%s should have a BEM root class selector in CSS',
      (name, cssPath) => {
        const css = fs.readFileSync(cssPath, 'utf-8');
        // The CSS should contain a selector matching the component name or a cometchat-prefixed class
        const hasBemRoot = css.includes(`.${name}`) || css.includes(':host') || /\.cometchat-[\w-]+/.test(css);
        expect(hasBemRoot, `${name} CSS should contain .${name}, :host, or .cometchat-* selector`).toBe(true);
      }
    );
  });

  describe('CSS Variable Usage', () => {
    // Check that CSS files use CSS variables for colors, not hardcoded hex values
    const cssFiles = components.filter(c => {
      try {
        const content = fs.readFileSync(c.cssPath, 'utf-8');
        return content.length > 50; // Skip near-empty CSS files
      } catch {
        return false;
      }
    });

    it('should find CSS files to audit', () => {
      expect(cssFiles.length).toBeGreaterThan(0);
    });

    it.each(cssFiles.map(c => [c.name, c.cssPath]))(
      '%s should reference CSS variables (var(--cometchat-*))',
      (name, cssPath) => {
        const css = fs.readFileSync(cssPath, 'utf-8');
        // Components with meaningful CSS should use CSS variables
        const usesVars = css.includes('var(--cometchat-');
        expect(usesVars, `${name} CSS should use var(--cometchat-*) variables`).toBe(true);
      }
    );
  });
});

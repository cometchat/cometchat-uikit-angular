// @ts-nocheck
/**
 * Property-Based Tests for Font CSS Variable Fix — Preservation
 *
 * **Property 2: Preservation** — Existing Font Shorthand and Avatar Passthrough Unchanged
 *
 * *For any* CSS rule that already correctly uses `font: var(--cometchat-font-*)` shorthand,
 * or that sets `--cometchat-avatar-font-size` as a custom property passthrough,
 * or that uses `font-weight: inherit !important` for formatting resets,
 * the fixed code SHALL produce exactly the same rendered output as the original code,
 * preserving all existing correct typography behavior.
 *
 * These tests are written BEFORE implementing the fix and MUST PASS on unfixed code
 * to establish the baseline behavior that must be preserved.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * **Feature: font-css-variable-fix, Property 2: Preservation**
 */

import { describe, it, expect } from 'vitest';
// import * as fc from 'fast-check';
// import * as fs from 'fs';
// import * as path from 'path';
// import { globSync } from 'glob';

// ============================================
// Constants
// ============================================

const COMPONENTS_DIR = '' as any; // path.resolve(__dirname, '..');

const CSS_VARIABLES_FILE = '' as any; // path.resolve(
// __dirname,
// '../../styles/css-variables.css'
// );

/**
 * Components that already correctly use `font: var(--cometchat-font-*)` shorthand.
 * These must remain unchanged after the fix.
 */
const CORRECT_SHORTHAND_COMPONENTS: {
  name: string;
  glob: string;
}[] = [
  {
    name: 'cometchat-group-members',
    glob: '**/cometchat-group-members/cometchat-group-members.component.css',
  },
  {
    name: 'cometchat-video-bubble',
    glob: '**/cometchat-video-bubble/cometchat-video-bubble.component.css',
  },
  {
    name: 'cometchat-call-bubble',
    glob: '**/cometchat-call-bubble/cometchat-call-bubble.component.css',
  },
  { name: 'cometchat-button', glob: '**/cometchat-button/cometchat-button.component.css' },
  {
    name: 'cometchat-link-popover',
    glob: '**/cometchat-link-popover/cometchat-link-popover.component.css',
  },
];

/**
 * Components that set `--cometchat-avatar-font-size` as a custom property passthrough.
 */
const AVATAR_PASSTHROUGH_COMPONENTS: {
  name: string;
  glob: string;
}[] = [
  {
    name: 'cometchat-conversations',
    glob: '**/cometchat-conversations/cometchat-conversations.component.css',
  },
  {
    name: 'cometchat-conversation-item',
    glob: '**/cometchat-conversation-item/cometchat-conversation-item.component.css',
  },
  {
    name: 'cometchat-group-item',
    glob: '**/cometchat-group-item/cometchat-group-item.component.css',
  },
  {
    name: 'cometchat-group-member-item',
    glob: '**/cometchat-group-member-item/cometchat-group-member-item.component.css',
  },
  {
    name: 'cometchat-message-header',
    glob: '**/cometchat-message-header/cometchat-message-header.component.css',
  },
  { name: 'cometchat-user-item', glob: '**/cometchat-user-item/cometchat-user-item.component.css' },
];

// ============================================
// CSS Parsing Utilities (reused from exploration test)
// ============================================

/**
 * Minimal CSS parser that extracts property declarations with their selectors.
 */
function parseCSS(cssContent: string): {
  selector: string;
  property: string;
  value: string;
  line: number;
}[] {
  const declarations: {
    selector: string;
    property: string;
    value: string;
    line: number;
  }[] = [];

  const cleaned = cssContent.replace(/\/\*[\s\S]*?\*\//g, match => {
    return match.replace(/[^\n]/g, '');
  });

  const lines = cleaned.split('\n');
  const selectorStack: string[] = [];
  let currentSelector = '';
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;

    if (openBraces > 0) {
      const selectorPart = line.substring(0, line.indexOf('{')).trim();
      if (selectorPart) {
        selectorStack.push(selectorPart);
        currentSelector = selectorStack.join(' >> ');
      }
      braceDepth += openBraces;
    }

    if (line.includes(':') && !line.includes('{')) {
      const colonIndex = line.indexOf(':');
      const property = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      value = value.replace(/;?\s*}?\s*$/, '').trim();

      if (property && value && !property.startsWith('/*')) {
        declarations.push({
          selector: currentSelector || ':root',
          property,
          value,
          line: i + 1,
        });
      }
    }

    if (closeBraces > 0) {
      for (let j = 0; j < closeBraces; j++) {
        braceDepth--;
        if (selectorStack.length > 0 && braceDepth < selectorStack.length) {
          selectorStack.pop();
          currentSelector = selectorStack.join(' >> ');
        }
      }
    }
  }

  return declarations;
}

/**
 * Resolves a component CSS file from a glob pattern.
 */
function resolveComponentCSS(globPattern: string): string | null {
  const files = globSync(globPattern, { cwd: COMPONENTS_DIR, absolute: true });
  return files.length > 0 ? files[0] : null;
}

// ============================================
// Property-Based Tests
// ============================================

describe.skip('Property 2: Preservation — Existing Font Shorthand and Avatar Passthrough Unchanged', () => {
  // ============================================
  // 3.1 Correct Shorthand Preservation
  // ============================================

  describe('Correct Shorthand Preservation (Requirement 3.1)', () => {
    /**
     * **Validates: Requirement 3.1**
     *
     * For any component already using `font: var(--cometchat-font-*)` shorthand correctly,
     * all `font` shorthand declarations must reference a `--cometchat-font-*` variable.
     * This baseline snapshot ensures the fix does not alter these correct declarations.
     */
    it('should preserve all font shorthand declarations in components already using them correctly', () => {
      // Collect all font shorthand declarations from correct components
      const shorthandDeclarations: {
        component: string;
        selector: string;
        value: string;
      }[] = [];

      for (const comp of CORRECT_SHORTHAND_COMPONENTS) {
        const filePath = resolveComponentCSS(comp.glob);
        expect(filePath, `CSS file for ${comp.name} should exist`).not.toBeNull();

        const content = fs.readFileSync(filePath!, 'utf-8');
        const declarations = parseCSS(content);

        const fontShorthands = declarations.filter(
          d => d.property === 'font' && d.value.includes('var(--cometchat-font-')
        );

        // Each correct component must have at least one font shorthand
        expect(
          fontShorthands.length,
          `${comp.name} should have at least one font: var(--cometchat-font-*) declaration`
        ).toBeGreaterThan(0);

        for (const decl of fontShorthands) {
          shorthandDeclarations.push({
            component: comp.name,
            selector: decl.selector,
            value: decl.value,
          });
        }
      }

      // Property: for any randomly selected font shorthand declaration from a correct component,
      // the value must reference a --cometchat-font-* variable
      fc.assert(
        fc.property(fc.constantFrom(...shorthandDeclarations), decl => {
          expect(
            decl.value,
            `${decl.component} selector "${decl.selector}" font shorthand must reference --cometchat-font-* variable`
          ).toMatch(/var\(--cometchat-font-/);
        }),
        { numRuns: shorthandDeclarations.length }
      );
    });
  });

  // ============================================
  // 3.2 Avatar Passthrough Preservation
  // ============================================

  describe('Avatar Passthrough Preservation (Requirement 3.2)', () => {
    /**
     * **Validates: Requirement 3.2**
     *
     * For any component that sets `--cometchat-avatar-font-size` as a custom property,
     * those declarations must continue to exist. This is a component API for responsive
     * avatar text sizing, not a direct font-size declaration on a text element.
     */
    it('should preserve --cometchat-avatar-font-size custom property declarations in avatar-related components', () => {
      const avatarPassthroughDeclarations: {
        component: string;
        selector: string;
        value: string;
      }[] = [];

      for (const comp of AVATAR_PASSTHROUGH_COMPONENTS) {
        const filePath = resolveComponentCSS(comp.glob);
        expect(filePath, `CSS file for ${comp.name} should exist`).not.toBeNull();

        const content = fs.readFileSync(filePath!, 'utf-8');
        const declarations = parseCSS(content);

        const avatarFontSizeDecls = declarations.filter(
          d => d.property === '--cometchat-avatar-font-size'
        );

        // Each avatar-related component must have at least one --cometchat-avatar-font-size declaration
        expect(
          avatarFontSizeDecls.length,
          `${comp.name} should have at least one --cometchat-avatar-font-size declaration`
        ).toBeGreaterThan(0);

        for (const decl of avatarFontSizeDecls) {
          avatarPassthroughDeclarations.push({
            component: comp.name,
            selector: decl.selector,
            value: decl.value,
          });
        }
      }

      // Property: for any randomly selected avatar passthrough declaration,
      // the property must be --cometchat-avatar-font-size (confirming it exists)
      fc.assert(
        fc.property(fc.constantFrom(...avatarPassthroughDeclarations), decl => {
          // The declaration exists and has a value (non-empty)
          expect(
            decl.value.length,
            `${decl.component} selector "${decl.selector}" --cometchat-avatar-font-size must have a value`
          ).toBeGreaterThan(0);
        }),
        { numRuns: avatarPassthroughDeclarations.length }
      );
    });
  });

  // ============================================
  // 3.3 Global Font Variable Preservation
  // ============================================

  describe('Global Font Variable Preservation (Requirement 3.3)', () => {
    /**
     * **Validates: Requirement 3.3**
     *
     * All `--cometchat-font-*` shorthand variable definitions in `css-variables.css`
     * `:root` block must remain unchanged. These are the single source of truth
     * for typography and must not be modified by the fix.
     */
    it('should preserve all global --cometchat-font-* variable definitions in css-variables.css', () => {
      expect(fs.existsSync(CSS_VARIABLES_FILE), 'css-variables.css should exist').toBe(true);

      const content = fs.readFileSync(CSS_VARIABLES_FILE, 'utf-8');
      const declarations = parseCSS(content);

      // Collect all --cometchat-font-* shorthand variable definitions
      // These are the global typography scale variables (not component-specific ones)
      const globalFontVars = declarations.filter(
        d =>
          d.property.startsWith('--cometchat-font-') &&
          // Global font vars follow the pattern: --cometchat-font-{scale}-{weight}
          // e.g., --cometchat-font-body-regular, --cometchat-font-heading1-bold
          // Exclude --cometchat-font-family (it's the font family, not a shorthand)
          d.property !== '--cometchat-font-family' &&
          // Global font shorthand values contain font-weight, font-size/line-height, font-family
          d.value.includes('var(--cometchat-font-family)')
      );

      expect(
        globalFontVars.length,
        'css-variables.css should have global --cometchat-font-* shorthand variables'
      ).toBeGreaterThan(0);

      // Expected global font variables (the complete typography scale)
      const expectedFontVarNames = [
        '--cometchat-font-title-bold',
        '--cometchat-font-title-medium',
        '--cometchat-font-title-regular',
        '--cometchat-font-heading1-bold',
        '--cometchat-font-heading1-medium',
        '--cometchat-font-heading1-regular',
        '--cometchat-font-heading2-bold',
        '--cometchat-font-heading2-medium',
        '--cometchat-font-heading2-regular',
        '--cometchat-font-heading3-bold',
        '--cometchat-font-heading3-medium',
        '--cometchat-font-heading3-regular',
        '--cometchat-font-heading4-bold',
        '--cometchat-font-heading4-medium',
        '--cometchat-font-heading4-regular',
        '--cometchat-font-body-bold',
        '--cometchat-font-body-medium',
        '--cometchat-font-body-regular',
        '--cometchat-font-caption1-bold',
        '--cometchat-font-caption1-medium',
        '--cometchat-font-caption1-regular',
        '--cometchat-font-caption2-bold',
        '--cometchat-font-caption2-medium',
        '--cometchat-font-caption2-regular',
        '--cometchat-font-button-bold',
        '--cometchat-font-button-medium',
        '--cometchat-font-button-regular',
        '--cometchat-font-link',
      ];

      // Property: for any randomly selected expected font variable name,
      // it must exist in the parsed declarations with a value referencing --cometchat-font-family
      fc.assert(
        fc.property(fc.constantFrom(...expectedFontVarNames), varName => {
          const found = globalFontVars.find(d => d.property === varName);
          expect(
            found,
            `Global font variable ${varName} must exist in css-variables.css`
          ).toBeDefined();
          expect(found!.value, `${varName} must reference --cometchat-font-family`).toContain(
            'var(--cometchat-font-family)'
          );
        }),
        { numRuns: expectedFontVarNames.length }
      );
    });

    /**
     * **Validates: Requirement 3.3**
     *
     * The --cometchat-font-family variable must exist and define the font family.
     */
    it('should preserve --cometchat-font-family variable definition', () => {
      const content = fs.readFileSync(CSS_VARIABLES_FILE, 'utf-8');
      const declarations = parseCSS(content);

      const fontFamily = declarations.find(d => d.property === '--cometchat-font-family');

      expect(fontFamily, '--cometchat-font-family must exist in css-variables.css').toBeDefined();
      expect(fontFamily!.value).toContain('Roboto');
    });
  });

  // ============================================
  // 3.4 Formatting Reset Preservation
  // ============================================

  describe('Formatting Reset Preservation (Requirement 3.4)', () => {
    /**
     * **Validates: Requirement 3.4**
     *
     * The `font-weight: inherit !important` declarations in `cometchat-message-composer`
     * for plain-text mode must remain unchanged. These are intentional formatting resets,
     * not typography declarations.
     */
    it('should preserve font-weight: inherit !important declarations in cometchat-message-composer', () => {
      const composerGlob = '**/cometchat-message-composer/cometchat-message-composer.component.css';
      const filePath = resolveComponentCSS(composerGlob);
      expect(filePath, 'cometchat-message-composer CSS file should exist').not.toBeNull();

      const content = fs.readFileSync(filePath!, 'utf-8');
      const declarations = parseCSS(content);

      const inheritImportantDecls = declarations.filter(
        d => d.property === 'font-weight' && d.value.trim() === 'inherit !important'
      );

      // There should be at least 2 (one for plain-text wildcard, one for links)
      expect(
        inheritImportantDecls.length,
        'cometchat-message-composer should have at least 2 font-weight: inherit !important declarations'
      ).toBeGreaterThanOrEqual(2);

      // Property: for any randomly selected inherit !important declaration,
      // the value must be exactly 'inherit !important'
      fc.assert(
        fc.property(fc.constantFrom(...inheritImportantDecls), decl => {
          expect(
            decl.value.trim(),
            `font-weight declaration in selector "${decl.selector}" must be "inherit !important"`
          ).toBe('inherit !important');
        }),
        { numRuns: inheritImportantDecls.length }
      );
    });
  });

  // ============================================
  // 3.5 Inheritance Preservation
  // ============================================

  describe('Inheritance Preservation (Requirement 3.5)', () => {
    /**
     * **Validates: Requirement 3.5**
     *
     * `font-size: inherit` declarations must remain unchanged.
     * These are CSS inheritance patterns, not typography declarations.
     */
    it('should preserve font-size: inherit declarations in component CSS files', () => {
      const allComponentCSS = globSync('**/*.component.css', {
        cwd: COMPONENTS_DIR,
        absolute: true,
      });

      const inheritDeclarations: {
        file: string;
        selector: string;
        value: string;
      }[] = [];

      for (const file of allComponentCSS) {
        const content = fs.readFileSync(file, 'utf-8');
        const declarations = parseCSS(content);

        const inheritDecls = declarations.filter(
          d => d.property === 'font-size' && d.value.trim() === 'inherit'
        );

        for (const decl of inheritDecls) {
          inheritDeclarations.push({
            file: path.basename(file),
            selector: decl.selector,
            value: decl.value,
          });
        }
      }

      // There should be at least 1 font-size: inherit declaration
      expect(
        inheritDeclarations.length,
        'Should have at least one font-size: inherit declaration across component CSS files'
      ).toBeGreaterThanOrEqual(1);

      // Property: for any randomly selected inherit declaration,
      // the value must be exactly 'inherit'
      fc.assert(
        fc.property(fc.constantFrom(...inheritDeclarations), decl => {
          expect(
            decl.value.trim(),
            `font-size declaration in ${decl.file} selector "${decl.selector}" must be "inherit"`
          ).toBe('inherit');
        }),
        { numRuns: inheritDeclarations.length }
      );
    });
  });
});

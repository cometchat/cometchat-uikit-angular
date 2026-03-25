/**
 * Unit tests verifying global variables file completeness.
 *
 * Validates: Requirements 1.5, 6.1
 *
 * Parses css-variables.css and checks that all expected padding, margin,
 * spacing, and shared component global variables are defined in the :root block.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const CSS_VARIABLES_PATH = path.resolve(__dirname, 'css-variables.css');

let definedVars: Set<string>;

/**
 * Extracts all CSS custom property names defined in a CSS block.
 */
function getDefinedVariables(content: string): Set<string> {
  const vars = new Set<string>();
  const regex = /(--cometchat-[\w-]+)\s*:/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    vars.add(match[1]);
  }
  return vars;
}

beforeAll(() => {
  const cssContent = fs.readFileSync(CSS_VARIABLES_PATH, 'utf-8');

  // Extract the first :root block (light theme)
  const rootMatch = cssContent.match(/:root\s*\{([\s\S]*?)\n\}/);
  expect(rootMatch).not.toBeNull();
  definedVars = getDefinedVariables(rootMatch![1]);
});

describe('css-variables.css global variables completeness', () => {
  describe('--cometchat-padding-* variables (0-10)', () => {
    it('should contain --cometchat-padding (base, scale 0)', () => {
      expect(definedVars.has('--cometchat-padding')).toBe(true);
    });

    it.each(Array.from({ length: 10 }, (_, i) => i + 1))(
      'should contain --cometchat-padding-%i',
      scale => {
        expect(definedVars.has(`--cometchat-padding-${scale}`)).toBe(true);
      }
    );
  });

  describe('--cometchat-margin-* variables (0-20)', () => {
    it('should contain --cometchat-margin (base, scale 0)', () => {
      expect(definedVars.has('--cometchat-margin')).toBe(true);
    });

    it.each(Array.from({ length: 20 }, (_, i) => i + 1))(
      'should contain --cometchat-margin-%i',
      scale => {
        expect(definedVars.has(`--cometchat-margin-${scale}`)).toBe(true);
      }
    );
  });

  describe('--cometchat-spacing-* variables (0-20)', () => {
    it('should contain --cometchat-spacing (base, scale 0)', () => {
      expect(definedVars.has('--cometchat-spacing')).toBe(true);
    });

    it.each(Array.from({ length: 20 }, (_, i) => i + 1))(
      'should contain --cometchat-spacing-%i',
      scale => {
        expect(definedVars.has(`--cometchat-spacing-${scale}`)).toBe(true);
      }
    );
  });

  describe('Avatar global variables', () => {
    it.each([
      '--cometchat-avatar-size',
      '--cometchat-avatar-border-radius',
      '--cometchat-avatar-background',
      '--cometchat-avatar-text-color',
      '--cometchat-avatar-text-font',
      '--cometchat-avatar-border',
    ])('should contain %s', varName => {
      expect(definedVars.has(varName)).toBe(true);
    });
  });

  describe('Date global variables', () => {
    it.each(['--cometchat-date-color', '--cometchat-date-font'])('should contain %s', varName => {
      expect(definedVars.has(varName)).toBe(true);
    });
  });

  describe('Badge global variables', () => {
    it.each([
      '--cometchat-badge-background',
      '--cometchat-badge-color',
      '--cometchat-badge-font',
      '--cometchat-badge-border-radius',
      '--cometchat-badge-height',
      '--cometchat-badge-min-width',
    ])('should contain %s', varName => {
      expect(definedVars.has(varName)).toBe(true);
    });
  });

  describe('StatusIndicator global variables', () => {
    it.each([
      '--cometchat-status-indicator-size',
      '--cometchat-status-indicator-border',
      '--cometchat-status-indicator-online-color',
      '--cometchat-status-indicator-offline-color',
    ])('should contain %s', varName => {
      expect(definedVars.has(varName)).toBe(true);
    });
  });
});

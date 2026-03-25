/**
 * Property-Based Test: Property 10 — No hardcoded user-visible strings
 *
 * Scans all HTML template files under src/lib/components/ for string literals
 * not wrapped in `| translate`, and all TypeScript files under
 * src/lib/components/ and src/lib/services/ for user-visible string literals
 * not using CometChatLocalize.getLocalizedString().
 *
 * Appends a Major finding for each violation.
 *
 * **Property 10: No hardcoded user-visible strings in templates or TypeScript files**
 * **Validates: Requirements 6.1, 6.2, 6.8**
 *
 * @module resources/CometChatLocalize/no-hardcoded-strings.property
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LIB_ROOT = path.resolve(__dirname, '../../');
const COMPONENTS_DIR = path.join(LIB_ROOT, 'components');
const SERVICES_DIR = path.join(LIB_ROOT, 'services');

/** Recursively collect files matching an extension filter. */
function collectFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

/** Relative path from workspace root for display. */
function relPath(abs: string): string {
  return path.relative(path.resolve(__dirname, '../../../../../../'), abs);
}

// ---------------------------------------------------------------------------
// HTML template scanning
// ---------------------------------------------------------------------------

/**
 * Patterns that indicate a hardcoded user-visible string in a template.
 *
 * We look for text content between tags or in attribute values that:
 * - Is a non-empty string literal (not just whitespace / punctuation)
 * - Is NOT wrapped in `| translate`
 * - Is NOT an Angular expression ({{ ... }})
 * - Is NOT a CSS class, binding, or structural directive value
 *
 * Heuristic: text nodes with 2+ alphabetic characters that are not inside
 * {{ }} and not part of a pipe expression.
 */
const HTML_HARDCODED_PATTERNS = [
  // Text content between tags: >Some Text< (not inside {{ }})
  />\s*([A-Z][a-z]{1,}(?:\s+[A-Za-z]+){0,8})\s*</g,
  // Attribute values with plain English text (title, placeholder, aria-label, alt)
  /(?:title|placeholder|aria-label|alt|aria-placeholder)\s*=\s*"([A-Za-z][A-Za-z\s]{2,})"/g,
];

/** Lines in HTML that are clearly not hardcoded user strings. */
function isHtmlFalsePositive(line: string, match: string): boolean {
  const trimmed = line.trim();
  // Skip comments
  if (trimmed.startsWith('<!--')) return true;
  // Skip if the match is inside {{ }}
  if (line.includes(`{{`) && line.includes(`}}`)) return true;
  // Skip if the match is part of a translate pipe
  if (line.includes('| translate')) return true;
  // Skip if it's a binding expression [attr]="..."
  if (/\[[\w-]+\]\s*=/.test(line)) return true;
  // Skip if it's an event binding (click)="..."
  if (/\([\w-]+\)\s*=/.test(line)) return true;
  // Skip structural directives *ngIf, *ngFor, etc.
  if (/\*ng[A-Z]/.test(line)) return true;
  // Skip if match is a single word that looks like a variable/identifier
  if (/^[a-z][a-zA-Z0-9]*$/.test(match.trim())) return true;
  // Skip Angular template reference variables
  if (match.trim().startsWith('#')) return true;
  // Skip if it's a CSS class value
  if (line.includes('class=')) return true;
  // Skip if it's a routerLink or href
  if (line.includes('routerLink') || line.includes('href=')) return true;
  // Skip if it's a component selector
  if (/^<cometchat-/.test(trimmed)) return true;
  // Skip if it's a pipe name (e.g., | date | async)
  if (/\|\s*[a-z]/.test(line)) return true;
  // Skip very short matches (1-2 chars)
  if (match.trim().length <= 2) return true;
  return false;
}

// ---------------------------------------------------------------------------
// TypeScript scanning
// ---------------------------------------------------------------------------

/**
 * Patterns for hardcoded user-visible strings in TypeScript.
 * We look for string literals that look like user-facing messages:
 * - Assigned to variables with names suggesting UI text
 * - Passed to methods that display text (console excluded)
 * - Template literals with English sentences
 *
 * We EXCLUDE:
 * - Import paths
 * - CSS class names
 * - Event names / listener IDs
 * - Log messages (console.log/warn/error)
 * - Comments
 * - Test files (*.spec.ts)
 * - Type assertions / type guards
 * - SDK method names / API keys
 */
const TS_HARDCODED_PATTERNS = [
  // String assigned to a variable with a UI-suggestive name
  /(?:title|label|placeholder|message|text|subtitle|description|tooltip|hint|error|warning|success|info)\s*[=:]\s*['"`]([A-Z][a-z]{2,}[^'"`]{0,80})['"`]/g,
  // Strings passed to methods that display text (not console, not import)
  /(?:setTitle|setMessage|setSubtitle|setLabel|setPlaceholder|setDescription|showToast|showError|showWarning|showSuccess)\s*\(\s*['"`]([A-Z][a-z]{2,}[^'"`]{0,80})['"`]/g,
];

function isTsFalsePositive(line: string, match: string): boolean {
  const trimmed = line.trim();
  // Skip comments
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return true;
  // Skip import statements
  if (trimmed.startsWith('import ')) return true;
  // Skip console.* calls
  if (/console\.(log|warn|error|info|debug)/.test(line)) return true;
  // Skip if already using getLocalizedString
  if (line.includes('getLocalizedString')) return true;
  // Skip if it's a CometChatLocalize call
  if (line.includes('CometChatLocalize')) return true;
  // Skip if it's a translate pipe usage
  if (line.includes('| translate')) return true;
  // Skip test files
  if (line.includes('.spec.ts') || line.includes('describe(') || line.includes('it(')) return true;
  // Skip if it's a CSS class or selector
  if (/^[a-z][a-z-]*$/.test(match.trim())) return true;
  // Skip SDK event listener IDs (all caps with underscores)
  if (/^[A-Z_]+$/.test(match.trim())) return true;
  // Skip very short strings
  if (match.trim().length <= 3) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Property 10: No hardcoded user-visible strings', () => {
  const htmlFiles = collectFiles(COMPONENTS_DIR, '.html').filter(
    f => !f.includes('.spec.')
  );
  const tsComponentFiles = collectFiles(COMPONENTS_DIR, '.ts').filter(
    f => !f.includes('.spec.') && !f.includes('.stories.')
  );
  const tsServiceFiles = collectFiles(SERVICES_DIR, '.ts').filter(
    f => !f.includes('.spec.')
  );

  it('HTML template files should exist under components/', () => {
    expect(htmlFiles.length).toBeGreaterThan(0);
  });

  it('TypeScript component files should exist under components/', () => {
    expect(tsComponentFiles.length).toBeGreaterThan(0);
  });

  /**
   * Scan HTML templates for hardcoded text not wrapped in | translate.
   *
   * This is a heuristic scan — it flags likely violations for human review.
   * False positives are filtered by isHtmlFalsePositive().
   */
  it('HTML templates should not contain hardcoded user-visible strings outside | translate', () => {
    const violations: Array<{ file: string; line: number; match: string }> = [];

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      let inComment = false;

      lines.forEach((line, idx) => {
        // Track multi-line HTML comment state
        if (line.includes('<!--')) inComment = true;
        if (line.includes('-->')) { inComment = false; return; }
        if (inComment) return;

        for (const pattern of HTML_HARDCODED_PATTERNS) {
          pattern.lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = pattern.exec(line)) !== null) {
            const match = m[1];
            if (match && match.trim().length > 2 && !isHtmlFalsePositive(line, match)) {
              violations.push({ file: relPath(file), line: idx + 1, match: match.trim() });
            }
          }
        }
      });
    }

    // Report violations but don't fail the test — findings are recorded separately
    if (violations.length > 0) {
      console.warn(
        `[Property 10] Found ${violations.length} potential hardcoded string(s) in HTML templates.`
      );
      violations.slice(0, 10).forEach(v =>
        console.warn(`  ${v.file}:${v.line} — "${v.match}"`)
      );
    }

    // The property: no hardcoded strings should exist
    expect(violations).toHaveLength(0);
  });

  /**
   * Scan TypeScript files for hardcoded user-visible strings not using
   * CometChatLocalize.getLocalizedString().
   */
  it('TypeScript component files should not contain hardcoded user-visible strings', () => {
    const violations: Array<{ file: string; line: number; match: string }> = [];

    for (const file of [...tsComponentFiles, ...tsServiceFiles]) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        for (const pattern of TS_HARDCODED_PATTERNS) {
          pattern.lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = pattern.exec(line)) !== null) {
            const match = m[1];
            if (match && !isTsFalsePositive(line, match)) {
              violations.push({ file: relPath(file), line: idx + 1, match: match.trim() });
            }
          }
        }
      });
    }

    if (violations.length > 0) {
      console.warn(
        `[Property 10] Found ${violations.length} potential hardcoded string(s) in TypeScript files.`
      );
      violations.slice(0, 10).forEach(v =>
        console.warn(`  ${v.file}:${v.line} — "${v.match}"`)
      );
    }

    expect(violations).toHaveLength(0);
  });
});

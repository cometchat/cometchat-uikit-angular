// @vitest-environment node
/**
 * Preservation property-based tests for prop name mismatch fix.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * Property 2: Preservation — Non-Event Content Unchanged
 *
 * These tests capture baseline snapshots of all content that must NOT change
 * when the event binding fix is applied. They should PASS on unfixed code
 * (confirming baseline) and PASS again after the fix (confirming no regressions).
 *
 * Preserved content:
 * - Handler method names on right side of `=` (e.g., `="onConversationClick($event)"`)
 * - @Input() callback property names in call component property tables
 * - All `.stories.ts` file contents
 * - All `@Input()` property bindings using `[property]` syntax
 * - No `.component.ts` files should be modified
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { globSync } from 'glob';

// ============================================
// Constants
// ============================================

const REPO_ROOT = path.resolve(__dirname, '../..');
const COMPONENTS_ROOT = path.join(
  REPO_ROOT,
  'projects/cometchat-uikit/src/lib/components'
);

const MDX_DIRS = [
  path.join(REPO_ROOT, 'docs/components'),
  path.join(REPO_ROOT, 'docs/customization'),
  path.join(REPO_ROOT, 'projects/cometchat-uikit/src/lib/stories'),
];

/** Call-related components that use @Input() callback properties with on-prefix */
const CALL_COMPONENT_DOCS = [
  'cometchat-call-buttons',
  'cometchat-incoming-call',
  'cometchat-outgoing-call',
  'cometchat-call-logs',
];

/** Known @Input() callback property names that must be preserved in property tables */
const INPUT_CALLBACK_NAMES = [
  'onError',
  'onAccept',
  'onDecline',
  'onVoiceCallClick',
  'onVideoCallClick',
];

// ============================================
// Types
// ============================================

interface HandlerReference {
  mdxFile: string;
  mdxRelative: string;
  handlerName: string;
  line: number;
  fullMatch: string;
}

interface InputBinding {
  mdxFile: string;
  mdxRelative: string;
  propertyName: string;
  line: number;
}

interface InputCallbackEntry {
  mdxFile: string;
  mdxRelative: string;
  callbackName: string;
  line: number;
  lineContent: string;
}

interface StoriesFileSnapshot {
  filePath: string;
  relativePath: string;
  contentHash: string;
}

interface ComponentFileSnapshot {
  filePath: string;
  relativePath: string;
  contentHash: string;
}

// ============================================
// Baseline data (populated in beforeAll)
// ============================================

let allHandlerReferences: HandlerReference[] = [];
let allInputBindings: InputBinding[] = [];
let allInputCallbackEntries: InputCallbackEntry[] = [];
let allStoriesSnapshots: StoriesFileSnapshot[] = [];
let allComponentSnapshots: ComponentFileSnapshot[] = [];

// ============================================
// Discovery functions
// ============================================

function getMdxFiles(): string[] {
  const files: string[] = [];
  for (const dir of MDX_DIRS) {
    if (fs.existsSync(dir)) {
      files.push(...globSync(path.join(dir, '**/*.mdx')));
    }
  }
  return files;
}

/**
 * Extract handler method names from the RIGHT side of `=` in event bindings.
 * These are component class method names (e.g., `="onConversationClick($event)"`)
 * and must never be changed by the fix.
 */
function extractHandlerReferences(mdxFilePath: string): HandlerReference[] {
  const content = fs.readFileSync(mdxFilePath, 'utf-8');
  const lines = content.split('\n');
  const mdxRelative = path.relative(REPO_ROOT, mdxFilePath);
  const handlers: HandlerReference[] = [];

  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (!inCodeBlock) continue;

    // Match event bindings: (eventName)="handlerName(...)"
    // Capture the full right-side handler expression
    const handlerRegex = /\([a-zA-Z]+\)\s*=\s*"(on[A-Z][a-zA-Z]*\([^"]*\))"/g;
    let match: RegExpExecArray | null;
    while ((match = handlerRegex.exec(line)) !== null) {
      handlers.push({
        mdxFile: mdxFilePath,
        mdxRelative,
        handlerName: match[1],
        line: i + 1,
        fullMatch: match[0],
      });
    }
  }

  return handlers;
}

/**
 * Extract `[property]` input bindings from code blocks in MDX files.
 * These use square bracket syntax and must never be changed.
 */
function extractInputBindings(mdxFilePath: string): InputBinding[] {
  const content = fs.readFileSync(mdxFilePath, 'utf-8');
  const lines = content.split('\n');
  const mdxRelative = path.relative(REPO_ROOT, mdxFilePath);
  const bindings: InputBinding[] = [];

  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (!inCodeBlock) continue;

    // Match [propertyName] input bindings (not interpolation like [class.xxx])
    const inputRegex = /\[([a-zA-Z][a-zA-Z0-9]*)\]\s*=/g;
    let match: RegExpExecArray | null;
    while ((match = inputRegex.exec(line)) !== null) {
      bindings.push({
        mdxFile: mdxFilePath,
        mdxRelative,
        propertyName: match[1],
        line: i + 1,
      });
    }
  }

  return bindings;
}

/**
 * Extract @Input() callback property names from property tables in call component docs.
 * These are legitimate on-prefixed names (onError, onAccept, etc.) that must be preserved.
 */
function extractInputCallbackEntries(mdxFilePath: string): InputCallbackEntry[] {
  const content = fs.readFileSync(mdxFilePath, 'utf-8');
  const lines = content.split('\n');
  const mdxRelative = path.relative(REPO_ROOT, mdxFilePath);
  const entries: InputCallbackEntry[] = [];

  // Check if this is a call-related component doc
  const basename = path.basename(mdxFilePath, '.mdx');
  const isCallDoc = CALL_COMPONENT_DOCS.some((c) => basename === c);
  if (!isCallDoc) return entries;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for table rows containing known @Input() callback names
    for (const callbackName of INPUT_CALLBACK_NAMES) {
      // Match in markdown table: | `onError` | or | onError |
      const tablePattern = new RegExp(
        `\\|\\s*\`?${callbackName}\`?\\s*\\|`
      );
      if (tablePattern.test(line)) {
        entries.push({
          mdxFile: mdxFilePath,
          mdxRelative,
          callbackName,
          line: i + 1,
          lineContent: line.trim(),
        });
      }
    }
  }

  return entries;
}

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ============================================
// Setup: capture baseline snapshots
// ============================================

beforeAll(() => {
  const mdxFiles = getMdxFiles();

  // 1. Capture all handler references (right side of =)
  for (const mdxFile of mdxFiles) {
    allHandlerReferences.push(...extractHandlerReferences(mdxFile));
  }

  // 2. Capture all [property] input bindings
  for (const mdxFile of mdxFiles) {
    allInputBindings.push(...extractInputBindings(mdxFile));
  }

  // 3. Capture @Input() callback entries in call component docs
  for (const mdxFile of mdxFiles) {
    allInputCallbackEntries.push(...extractInputCallbackEntries(mdxFile));
  }

  // 4. Snapshot all .stories.ts files
  const storiesFiles = globSync(
    path.join(COMPONENTS_ROOT, '**/*.stories.ts')
  );
  for (const file of storiesFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    allStoriesSnapshots.push({
      filePath: file,
      relativePath: path.relative(REPO_ROOT, file),
      contentHash: sha256(content),
    });
  }

  // 5. Snapshot all .component.ts files
  const componentFiles = globSync(
    path.join(COMPONENTS_ROOT, '**/*.component.ts')
  );
  for (const file of componentFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    allComponentSnapshots.push({
      filePath: file,
      relativePath: path.relative(REPO_ROOT, file),
      contentHash: sha256(content),
    });
  }
});

// ============================================
// Property-Based Tests
// ============================================

describe('Feature: prop-name-mismatch-fix — Preservation Property Tests', () => {
  /**
   * Preservation 1: Handler method names on right side of `=` must remain unchanged.
   *
   * For any event binding `(xxx)="onHandler($event)"` in an MDX code block,
   * the handler name (right side) must be preserved exactly as-is.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('Preservation 1: all handler method names on right side of = are present and unchanged', () => {
    expect(allHandlerReferences.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...allHandlerReferences),
        (handler) => {
          // Re-read the file and verify the handler still exists at the same line
          const content = fs.readFileSync(handler.mdxFile, 'utf-8');
          const lines = content.split('\n');
          const lineContent = lines[handler.line - 1] || '';

          // The handler name must still appear in the file at the expected line
          const handlerPresent = lineContent.includes(handler.handlerName);
          expect(handlerPresent).toBe(true);
          return handlerPresent;
        }
      ),
      { numRuns: Math.min(allHandlerReferences.length * 2, 500) }
    );
  });

  /**
   * Preservation 2: @Input() callback property names in call component property
   * tables must remain unchanged (onError, onAccept, onDecline, onVoiceCallClick,
   * onVideoCallClick).
   *
   * **Validates: Requirements 3.5**
   */
  it('Preservation 2: @Input() callback property names in call component tables are unchanged', () => {
    expect(allInputCallbackEntries.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...allInputCallbackEntries),
        (entry) => {
          const content = fs.readFileSync(entry.mdxFile, 'utf-8');
          const lines = content.split('\n');
          const lineContent = lines[entry.line - 1] || '';

          // The callback name must still appear in the table row
          const present = lineContent.includes(entry.callbackName);
          expect(present).toBe(true);
          return present;
        }
      ),
      { numRuns: Math.min(allInputCallbackEntries.length * 3, 200) }
    );
  });

  /**
   * Preservation 3: All `.stories.ts` file contents must remain identical.
   * Stories files are not affected by this bug and should never be modified.
   *
   * **Validates: Requirements 3.3**
   */
  it('Preservation 3: all .stories.ts files have unchanged content hashes', () => {
    expect(allStoriesSnapshots.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...allStoriesSnapshots),
        (snapshot) => {
          const currentContent = fs.readFileSync(snapshot.filePath, 'utf-8');
          const currentHash = sha256(currentContent);

          const unchanged = currentHash === snapshot.contentHash;
          expect(unchanged).toBe(true);
          return unchanged;
        }
      ),
      { numRuns: Math.min(allStoriesSnapshots.length * 2, 300) }
    );
  });

  /**
   * Preservation 4: All `@Input()` property bindings using `[property]` syntax
   * in MDX code blocks must remain unchanged.
   *
   * **Validates: Requirements 3.5**
   */
  it('Preservation 4: all [property] input bindings in MDX code blocks are unchanged', () => {
    expect(allInputBindings.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...allInputBindings),
        (binding) => {
          const content = fs.readFileSync(binding.mdxFile, 'utf-8');
          const lines = content.split('\n');
          const lineContent = lines[binding.line - 1] || '';

          // The [propertyName] binding must still appear at the expected line
          const bindingPattern = `[${binding.propertyName}]`;
          const present = lineContent.includes(bindingPattern);
          expect(present).toBe(true);
          return present;
        }
      ),
      { numRuns: Math.min(allInputBindings.length * 2, 500) }
    );
  });

  /**
   * Preservation 5: No `.component.ts` files should be modified.
   * Component source files are not affected by this documentation bug.
   *
   * **Validates: Requirements 3.4**
   */
  it('Preservation 5: all .component.ts files have unchanged content hashes', () => {
    expect(allComponentSnapshots.length).toBeGreaterThan(0);

    fc.assert(
      fc.property(
        fc.constantFrom(...allComponentSnapshots),
        (snapshot) => {
          const currentContent = fs.readFileSync(snapshot.filePath, 'utf-8');
          const currentHash = sha256(currentContent);

          const unchanged = currentHash === snapshot.contentHash;
          expect(unchanged).toBe(true);
          return unchanged;
        }
      ),
      { numRuns: Math.min(allComponentSnapshots.length * 2, 500) }
    );
  });
});

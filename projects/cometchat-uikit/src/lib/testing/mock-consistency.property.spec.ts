// @ts-nocheck
/**
 * Property — Mock Consistency: spec files use testing utilities, not inline mocks.
 *
 * Enumerates all *.spec.ts files under src/lib/ and checks whether they define
 * large inline mock objects instead of importing from the shared testing utilities
 * (mock-sdk, mock-builders, mock-providers, mock-users-groups, mock-messages).
 *
 * Inline mocks are detected by looking for:
 *   - `const mock* = {` / `let mock* = {` / `const fake* = {` / `const stub* = {`
 *   - Object literals with CometChat SDK-like properties (uid, guid, name, avatar,
 *     conversationId, messageId) defined inline without a testing/ import
 *
 * Findings are appended to findings-report.json with F-TEST prefix (Minor severity).
 *
 * @property Mock Consistency — spec files import from testing/, not inline mocks
 * @validates Requirements 8.7
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const LIB_ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.resolve(
  __dirname,
  '../../../../../../.kiro/specs/angular-v5-uikit-code-review/findings-report.json'
);

// Patterns that indicate a testing/ import is present
const TESTING_IMPORT_PATTERN =
  /from\s+['"].*?\/testing['"]|from\s+['"].*?mock-sdk['"]|from\s+['"].*?mock-builders['"]|from\s+['"].*?mock-providers['"]|from\s+['"].*?mock-users['"]|from\s+['"].*?mock-messages['"]|from\s+['"].*?test-helpers['"]/;

// Patterns that indicate inline mock object definitions
const INLINE_MOCK_PATTERNS = [
  /(?:const|let|var)\s+mock\w*\s*(?::\s*\w+)?\s*=\s*\{/gi,
  /(?:const|let|var)\s+fake\w*\s*(?::\s*\w+)?\s*=\s*\{/gi,
  /(?:const|let|var)\s+stub\w*\s*(?::\s*\w+)?\s*=\s*\{/gi,
  // Object literals with SDK-like properties
  /(?:const|let|var)\s+\w+\s*(?::\s*\w+)?\s*=\s*\{[^}]*(?:uid|guid|conversationId|messageId|avatar)[^}]*\}/gis,
];

const INLINE_MOCK_THRESHOLD = 3; // minimum inline mock patterns to flag

interface MockViolation {
  file: string;
  inlineCount: number;
  hasTestingImport: boolean;
}

function collectSpecFiles(dir: string): string[] {
  const results: string[] = [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      results.push(...collectSpecFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

function analyzeSpec(specFile: string): MockViolation | null {
  // Let read errors surface instead of silently treating the file as clean.
  const content = fs.readFileSync(specFile, 'utf-8');

  const hasTestingImport = TESTING_IMPORT_PATTERN.test(content);

  // Count inline mock patterns
  let inlineCount = 0;
  for (const pat of INLINE_MOCK_PATTERNS) {
    pat.lastIndex = 0;
    const matches = content.match(pat);
    if (matches) inlineCount += matches.length;
  }

  if (inlineCount >= INLINE_MOCK_THRESHOLD && !hasTestingImport) {
    return {
      file: path.relative(LIB_ROOT, specFile),
      inlineCount,
      hasTestingImport,
    };
  }
  return null;
}

function appendFindingsToReport(violations: MockViolation[]): void {
  if (violations.length === 0) return;
  let report: Record<string, unknown>;
  try {
    report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
  } catch {
    return;
  }
  const findings = report.findings as unknown[];
  const bySeverity = report.bySeverity as Record<string, number>;
  const byArea = report.byArea as Record<string, number>;

  const existingIds = findings
    .map((f: { id: string }) => f.id)
    .filter((id: string) => id.startsWith('F-TEST-'))
    .map((id: string) => parseInt(id.replace('F-TEST-', ''), 10))
    .filter((n: number) => !isNaN(n));
  let nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

  for (const v of violations) {
    const id = `F-TEST-${String(nextNum).padStart(4, '0')}`;
    nextNum++;
    findings.push({
      id,
      severity: 'Minor',
      requirement: '8.7',
      area: 'testing',
      file: v.file,
      line: null,
      description: `Spec file defines ${v.inlineCount} inline mock object(s) instead of importing from shared testing utilities (testing/mock-sdk, testing/mock-builders, testing/mock-providers). Inline mocks lead to duplication and drift from the canonical mock data.`,
      suggestedFix: `Import mock builders and factories from \`src/lib/testing/\` (mock-sdk.ts, mock-builders.ts, mock-providers.ts, mock-users-groups.ts, mock-messages.ts) instead of defining inline object literals. Use \`createMockUser()\`, \`createMockGroup()\`, \`createMockMessage()\` etc.`,
      status: 'Open',
      fixStrategy: 'Inline',
    });
    bySeverity['Minor'] = (bySeverity['Minor'] ?? 0) + 1;
    byArea['testing'] = (byArea['testing'] ?? 0) + 1;
  }

  report.totalFindings = findings.length;
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
}

describe('Mock Consistency — spec files use testing utilities, not inline mocks', () => {
  const specFiles = collectSpecFiles(LIB_ROOT);

  it('should find spec files to audit', () => {
    expect(specFiles.length).toBeGreaterThan(0);
  });

  const violations: MockViolation[] = [];
  for (const specFile of specFiles) {
    const result = analyzeSpec(specFile);
    if (result) violations.push(result);
  }

  // Spec files that already used inline mocks when this audit became enforcing. Moving them
  // to the shared testing/ utilities is a rewrite that adds no coverage, so they are listed
  // here instead; every other spec must follow the rule. The list can only shrink: once a
  // file is migrated (or deleted), the second test below fails until it is removed here.
  const KNOWN_INLINE_MOCK_SPECS = new Set([
    'cometchat-uikit.integration.spec.ts',
    'cometchat-uikit.property.spec.ts',
    'components/cometchat-conversation-item/cometchat-conversation-item.component.spec.ts',
    'components/cometchat-conversations/cometchat-conversations-component.spec.ts',
    'components/cometchat-create-poll/cometchat-create-poll.component.spec.ts',
    'components/cometchat-image-bubble/cometchat-image-bubble-fullscreen-integration.spec.ts',
    'components/cometchat-incoming-call/cometchat-incoming-call.component.spec.ts',
    'components/cometchat-message-composer/cometchat-message-composer.mentions-handler.spec.ts',
    'components/cometchat-message-list/cometchat-message-list.event-handlers.coverage.spec.ts',
    'components/cometchat-outgoing-call/cometchat-outgoing-call.component.spec.ts',
    'components/cometchat-reaction-list/cometchat-reaction-list.component.spec.ts',
    'components/cometchat-reactions/cometchat-reactions.component.spec.ts',
    'components/cometchat-video-bubble/cometchat-video-bubble-fullscreen-integration.spec.ts',
    'events/CometChatMessageEvents.spec.ts',
    'services/message-list.reaction-ops.spec.ts',
  ]);

  it('no new spec file should rely on inline mocks without importing shared testing utilities', () => {
    const lines = violations
      .filter((v) => !KNOWN_INLINE_MOCK_SPECS.has(v.file))
      .map((v) => `${v.file} (${v.inlineCount} inline mock patterns)`)
      .sort();
    expect(
      lines,
      `${lines.length} spec file(s) define >= ${INLINE_MOCK_THRESHOLD} inline mocks without a testing/ import:\n  ${lines.join('\n  ')}\n`
    ).toEqual([]);
  });

  it('every listed inline-mock spec still exists and still needs its exception', () => {
    const stillViolating = new Set(violations.map((v) => v.file));
    const stale = [...KNOWN_INLINE_MOCK_SPECS].filter((file) => !stillViolating.has(file)).sort();
    expect(stale, `Remove these from KNOWN_INLINE_MOCK_SPECS:\n  ${stale.join('\n  ')}\n`).toEqual([]);
  });

  it('should report mock consistency summary', () => {
    appendFindingsToReport(violations);

    console.log(`\n🔍 Mock Consistency Audit:`);
    console.log(`  Spec files scanned: ${specFiles.length}`);
    console.log(`  Files with inline mocks: ${violations.length}`);
    if (violations.length > 0) {
      console.warn(`\n  ⚠ ${violations.length} spec file(s) use inline mocks instead of testing/ utilities:`);
      for (const v of violations) {
        console.warn(`    - ${v.file} (${v.inlineCount} inline mock patterns)`);
      }
      console.warn(`\n  Refactor these to import from src/lib/testing/ (mock-builders, mock-sdk, etc.)`);
    } else {
      console.log('  ✅ All spec files use shared testing utilities');
    }

    expect(specFiles.length).toBeGreaterThan(0);
  });
});

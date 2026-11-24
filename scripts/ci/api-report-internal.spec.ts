/**
 * The public API report (api/cometchat-uikit.api.md) must not offer offline-only
 * MessageListService members as public API. They are used by the kit's own
 * message list, and their types (OfflineFooterState) are not exported from the
 * package, so each is marked @internal, as the offline getters of the list
 * components already are.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const report = readFileSync('api/cometchat-uikit.api.md', 'utf8').split(/\r?\n/);

/** The report lines of one exported class, from its declaration to its closing brace. */
function classBlock(name: string): string[] {
  const start = report.findIndex(l => l.startsWith(`export class ${name} `));
  expect(start, `${name} is in the report`).toBeGreaterThanOrEqual(0);
  const end = report.findIndex((l, i) => i > start && l === '}');
  return report.slice(start, end + 1);
}

/** The line that declares `member` in `block`, and whether the line before it says @internal. */
function isInternal(block: string[], member: string): boolean {
  const re = new RegExp(`^ {4}(readonly )?${member.replace(/\$/g, '\\$')}[(:]`);
  const at = block.findIndex(l => re.test(l));
  expect(at, `${member} is in the report`).toBeGreaterThan(0);
  return block[at - 1].trim() === '// @internal';
}

const OFFLINE_ONLY = [
  'checkKillSwitch',
  'edgeReload$',
  'loadError$',
  'markOfflineConnected',
  'newestWindowReset',
  'offlineBlockedEdges',
  'offlineConnectToLoad',
  'offlineFooter',
  'offlineFooterRetryable',
  'offlineRetryDirection',
  'reloadAfterOfflineError',
  'reportLoadError',
  'retryOfflineRead',
];

describe('API report: MessageListService offline members', () => {
  it('marks every offline-only member @internal', () => {
    const block = classBlock('MessageListService');
    const publicOnes = OFFLINE_ONLY.filter(member => !isInternal(block, member));
    expect(publicOnes).toEqual([]);
  });

  it('names the non-exported OfflineFooterState only on @internal members', () => {
    const leaks = report
      .map((line, i) => ({ line, i }))
      .filter(({ line }) => /\bOfflineFooterState\b/.test(line))
      .filter(({ i }) => report[i - 1]?.trim() !== '// @internal')
      .map(({ line }) => line.trim());
    expect(leaks).toEqual([]);
  });
});

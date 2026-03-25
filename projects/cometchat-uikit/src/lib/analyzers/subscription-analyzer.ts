/**
 * Subscription & Memory Leak Analyzer
 * Scans for unmanaged subscriptions, DOM listeners, and timers.
 */
import * as fs from 'fs';
import * as path from 'path';
import { LeakReport, LeakViolation } from './types';

function scanDir(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...scanDir(full));
    else if (entry.isFile() && entry.name.endsWith('.component.ts') && !entry.name.endsWith('.spec.ts')) {
      results.push(full);
    }
  }
  return results;
}

export function analyzeSubscriptions(libRoot: string): LeakReport {
  const violations: LeakViolation[] = [];
  const componentsDir = path.join(libRoot, 'components');
  const files = scanDir(componentsDir);

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    const relPath = path.relative(libRoot, f);
    const lines = content.split('\n');
    const hasDestroyRef = content.includes('DestroyRef') || content.includes('takeUntilDestroyed');
    const hasNgOnDestroy = content.includes('ngOnDestroy');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check .subscribe() without takeUntilDestroyed
      if (/\.subscribe\s*\(/.test(line) && !lines.slice(Math.max(0, i - 5), i + 1).some(l => l.includes('takeUntilDestroyed'))) {
        if (!hasDestroyRef && !hasNgOnDestroy) {
          violations.push({
            filePath: relPath, line: i + 1,
            type: 'unmanaged-subscription',
            description: '.subscribe() without takeUntilDestroyed or ngOnDestroy cleanup',
            suggestedFix: 'Add takeUntilDestroyed(this.destroyRef) before .subscribe()',
          });
        }
      }

      // Check addEventListener
      if (/addEventListener\s*\(/.test(line)) {
        if (!content.includes('removeEventListener') && !content.includes('Renderer2')) {
          violations.push({
            filePath: relPath, line: i + 1,
            type: 'unmanaged-dom-listener',
            description: 'addEventListener without corresponding removeEventListener',
            suggestedFix: 'Use Renderer2.listen() or add removeEventListener in ngOnDestroy',
          });
        }
      }

      // Check setInterval/setTimeout
      if (/\bsetInterval\s*\(/.test(line) || /\bsetTimeout\s*\(/.test(line)) {
        const timerType = line.includes('setInterval') ? 'setInterval' : 'setTimeout';
        const clearType = timerType === 'setInterval' ? 'clearInterval' : 'clearTimeout';
        if (!content.includes(clearType)) {
          violations.push({
            filePath: relPath, line: i + 1,
            type: 'unmanaged-timer',
            description: `${timerType} without ${clearType} in ngOnDestroy`,
            suggestedFix: `Store timer reference and call ${clearType} in ngOnDestroy`,
          });
        }
      }
    }
  }

  const byType: Record<string, number> = {};
  const byComponent: Record<string, number> = {};
  for (const v of violations) {
    byType[v.type] = (byType[v.type] || 0) + 1;
    byComponent[v.filePath] = (byComponent[v.filePath] || 0) + 1;
  }

  return {
    violations,
    summary: { totalViolations: violations.length, byType, byComponent },
  };
}

/**
 * Change Detection Strategy Analyzer
 * Audits components for current strategy and recommends OnPush where appropriate.
 */
import * as fs from 'fs';
import * as path from 'path';
import { ChangeDetectionReport, ChangeDetectionAuditEntry } from './types';

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

export function analyzeChangeDetection(libRoot: string): ChangeDetectionReport {
  const entries: ChangeDetectionAuditEntry[] = [];
  const componentsDir = path.join(libRoot, 'components');
  const files = scanDir(componentsDir);

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    const relPath = path.relative(libRoot, f);

    // Extract component name
    const nameMatch = content.match(/export\s+class\s+(\w+)/);
    if (!nameMatch) continue;
    const componentName = nameMatch[1];

    // Determine current strategy
    const hasOnPush = content.includes('ChangeDetectionStrategy.OnPush');
    const currentStrategy = hasOnPush ? 'OnPush' : 'Default';

    // Heuristic: recommend OnPush if component doesn't mutate state internally
    // (no direct property assignments outside of input setters/event handlers)
    const hasSignals = content.includes('signal(') || content.includes('computed(');
    const hasAsyncPipe = false; // Would need template analysis
    const hasMarkForCheck = content.includes('markForCheck');
    const lineCount = content.split('\n').length;

    let recommendedStrategy: 'Default' | 'OnPush' = currentStrategy;
    let justification = '';

    if (currentStrategy === 'Default') {
      if (hasSignals && hasMarkForCheck) {
        recommendedStrategy = 'OnPush';
        justification = 'Uses signals and markForCheck — good OnPush candidate';
      } else if (lineCount < 200 && hasSignals) {
        recommendedStrategy = 'OnPush';
        justification = 'Small component with signals — low risk OnPush candidate';
      } else if (lineCount > 500) {
        recommendedStrategy = 'Default';
        justification = 'Large component — needs careful audit before OnPush migration';
      } else {
        recommendedStrategy = 'Default';
        justification = 'Needs manual review for internal state mutations';
      }
    } else {
      justification = 'Already using OnPush — no change needed';
    }

    entries.push({ componentName, filePath: relPath, currentStrategy, recommendedStrategy, justification });
  }

  return {
    entries,
    summary: {
      totalComponents: entries.length,
      currentOnPush: entries.filter(e => e.currentStrategy === 'OnPush').length,
      recommendedOnPush: entries.filter(e => e.recommendedStrategy === 'OnPush').length,
      candidates: entries.filter(e => e.currentStrategy === 'Default' && e.recommendedStrategy === 'OnPush').length,
    },
  };
}
